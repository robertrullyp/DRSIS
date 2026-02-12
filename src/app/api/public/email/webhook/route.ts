import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAuditEvent } from "@/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookSchema = z.object({
  providerMsgId: z.string().min(1),
  status: z
    .enum(["pending", "sent", "delivered", "failed", "cancelled"])
    .optional()
    .default("delivered"),
  raw: z.unknown().optional(),
});

function mapStatus(status: z.infer<typeof webhookSchema>["status"]) {
  switch (status) {
    case "pending":
      return "PENDING" as const;
    case "sent":
      return "SENT" as const;
    case "delivered":
      return "DELIVERED" as const;
    case "failed":
      return "FAILED" as const;
    case "cancelled":
      return "CANCELLED" as const;
  }
}

function isTerminal(status: string) {
  return status === "DELIVERED" || status === "FAILED" || status === "CANCELLED";
}

function isValidForwardTransition(from: string, to: string) {
  if (from === to) return true;
  if (isTerminal(from)) return false;
  if (to === "DELIVERED") return from === "PENDING" || from === "SENT";
  if (to === "FAILED") return from === "PENDING" || from === "SENT";
  if (to === "CANCELLED") return from === "PENDING";
  if (to === "SENT") return from === "PENDING";
  if (to === "PENDING") return false;
  return false;
}

export async function POST(req: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const key = req.headers.get("x-webhook-key");
    if (key !== secret) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { providerMsgId, status } = parsed.data;
  const mapped = mapStatus(status);

  const existing = await prisma.emailOutbox.findFirst({ where: { providerMsgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shouldUpdate = isValidForwardTransition(existing.status, mapped);
  const updated = shouldUpdate
    ? await prisma.emailOutbox.update({
        where: { id: existing.id },
        data: { status: mapped },
      })
    : existing;

  await writeAuditEvent(prisma, {
    actorId: null,
    type: "email.webhook.update",
    entity: "EmailOutbox",
    entityId: existing.id,
    meta: {
      providerMsgId,
      fromStatus: existing.status,
      toStatus: mapped,
      updated: shouldUpdate,
    },
  });

  return NextResponse.json({
    ok: true,
    id: existing.id,
    updated: shouldUpdate,
    status: updated.status,
  });
}

