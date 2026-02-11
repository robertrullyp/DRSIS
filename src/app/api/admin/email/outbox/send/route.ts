import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email-provider";

function compile(content: string, payload?: Record<string, unknown> | null) {
  if (!payload) return content;
  return content.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_m, k) => {
    const parts = String(k).split(".");
    let val: any = payload;
    for (const p of parts) val = val?.[p];
    return typeof val === "undefined" || val === null ? "" : String(val);
  });
}

export async function POST(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
  const now = new Date();
  const pendings = await prisma.emailOutbox.findMany({ where: { status: "PENDING", OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] }, orderBy: { id: "asc" }, take: Math.max(1, Math.min(100, limit)) });
  const results: Record<string, string> = {};
  for (const o of pendings) {
    try {
      let subject = o.subject || "";
      let html = "";
      const payloadStr = (o as any).payload as any as string | null;
      let payloadObj: any = undefined;
      if (payloadStr) { try { payloadObj = JSON.parse(payloadStr); } catch {} }
      if (o.templateId) {
        const tpl = await prisma.emailTemplate.findUnique({ where: { id: o.templateId } });
        subject = compile(tpl?.subject || subject, payloadObj);
        html = compile(tpl?.content || html, payloadObj);
      } else {
        const payload = payloadObj;
        html = (payload && payload.html) ? String(payload.html) : JSON.stringify(payload || {});
      }
      const sent = await sendEmail(o.to, subject, html);
      await prisma.emailOutbox.update({ where: { id: o.id }, data: { status: "SENT", providerMsgId: sent.providerMsgId, sentAt: new Date(), attempts: { increment: 1 }, nextAttemptAt: null } });
      results[o.id] = "SENT";
    } catch {
      const attempts = o.attempts ?? 0;
      const delayMinutes = Math.min(60, Math.pow(2, attempts) || 1);
      const next = new Date(Date.now() + delayMinutes * 60000);
      await prisma.emailOutbox.update({ where: { id: o.id }, data: { status: "PENDING", attempts: { increment: 1 }, nextAttemptAt: next } });
      results[o.id] = "RETRY";
    }
  }
  return NextResponse.json({ processed: Object.keys(results).length, results });
}
