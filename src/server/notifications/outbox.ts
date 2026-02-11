import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email-provider";
import { sendWa } from "@/lib/wa-provider";

type SenderStatus = "SENT" | "RETRY" | "FAILED";

export type OutboxProcessResult = {
  processed: number;
  results: Record<string, SenderStatus>;
};

function clampLimit(limit: number) {
  if (!Number.isFinite(limit)) return 20;
  return Math.max(1, Math.min(100, Math.trunc(limit)));
}

function resolveMaxAttempts() {
  const raw = Number(process.env.OUTBOX_MAX_ATTEMPTS || "5");
  if (!Number.isFinite(raw)) return 5;
  return Math.max(1, Math.trunc(raw));
}

function parsePayload(payload: string | null | undefined): Record<string, unknown> | null {
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function compileTemplate(content: string, payload?: Record<string, unknown> | null) {
  if (!payload) return content;
  return content.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_match, key) => {
    const path = String(key).split(".");
    let value: unknown = payload;
    for (const segment of path) {
      value = (value as Record<string, unknown> | undefined)?.[segment];
    }
    return value == null ? "" : String(value);
  });
}

export async function processWaOutbox(limit: number): Promise<OutboxProcessResult> {
  const now = new Date();
  const maxAttempts = resolveMaxAttempts();
  const pendings = await prisma.waOutbox.findMany({
    where: {
      status: "PENDING",
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: { id: "asc" },
    take: clampLimit(limit),
  });

  const results: Record<string, SenderStatus> = {};
  for (const outbox of pendings) {
    try {
      const payload = parsePayload(outbox.payload);
      let text = "";

      if (outbox.templateId) {
        const template = await prisma.waTemplate.findUnique({ where: { id: outbox.templateId } });
        text = compileTemplate(template?.content || "", payload);
      } else {
        text = payload?.text ? String(payload.text) : JSON.stringify(payload ?? {});
      }

      const sent = await sendWa(outbox.to, text);
      await prisma.waOutbox.update({
        where: { id: outbox.id },
        data: {
          status: "SENT",
          providerMsgId: sent.providerMsgId,
          sentAt: new Date(),
          attempts: { increment: 1 },
          nextAttemptAt: null,
        },
      });
      results[outbox.id] = "SENT";
    } catch {
      const attemptNumber = (outbox.attempts ?? 0) + 1;
      const shouldFail = attemptNumber >= maxAttempts;
      const delayMinutes = Math.min(60, Math.pow(2, Math.max(0, outbox.attempts ?? 0)) || 1);
      const nextAttemptAt = shouldFail ? null : new Date(Date.now() + delayMinutes * 60_000);

      await prisma.waOutbox.update({
        where: { id: outbox.id },
        data: {
          status: shouldFail ? "FAILED" : "PENDING",
          attempts: { increment: 1 },
          nextAttemptAt,
        },
      });
      results[outbox.id] = shouldFail ? "FAILED" : "RETRY";
    }
  }

  return { processed: Object.keys(results).length, results };
}

export async function processEmailOutbox(limit: number): Promise<OutboxProcessResult> {
  const now = new Date();
  const maxAttempts = resolveMaxAttempts();
  const pendings = await prisma.emailOutbox.findMany({
    where: {
      status: "PENDING",
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: { id: "asc" },
    take: clampLimit(limit),
  });

  const results: Record<string, SenderStatus> = {};
  for (const outbox of pendings) {
    try {
      const payload = parsePayload(outbox.payload);
      let subject = outbox.subject || "";
      let html = "";

      if (outbox.templateId) {
        const template = await prisma.emailTemplate.findUnique({ where: { id: outbox.templateId } });
        subject = compileTemplate(template?.subject || subject, payload);
        html = compileTemplate(template?.content || html, payload);
      } else {
        html = payload?.html ? String(payload.html) : JSON.stringify(payload ?? {});
      }

      const sent = await sendEmail(outbox.to, subject, html);
      await prisma.emailOutbox.update({
        where: { id: outbox.id },
        data: {
          status: "SENT",
          providerMsgId: sent.providerMsgId,
          sentAt: new Date(),
          attempts: { increment: 1 },
          nextAttemptAt: null,
        },
      });
      results[outbox.id] = "SENT";
    } catch {
      const attemptNumber = (outbox.attempts ?? 0) + 1;
      const shouldFail = attemptNumber >= maxAttempts;
      const delayMinutes = Math.min(60, Math.pow(2, Math.max(0, outbox.attempts ?? 0)) || 1);
      const nextAttemptAt = shouldFail ? null : new Date(Date.now() + delayMinutes * 60_000);

      await prisma.emailOutbox.update({
        where: { id: outbox.id },
        data: {
          status: shouldFail ? "FAILED" : "PENDING",
          attempts: { increment: 1 },
          nextAttemptAt,
        },
      });
      results[outbox.id] = shouldFail ? "FAILED" : "RETRY";
    }
  }

  return { processed: Object.keys(results).length, results };
}
