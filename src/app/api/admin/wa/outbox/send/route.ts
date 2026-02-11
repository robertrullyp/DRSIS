import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWa } from "@/lib/wa-provider";

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
  const pendings = await prisma.waOutbox.findMany({ where: { status: "PENDING", OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] }, orderBy: { id: "asc" }, take: Math.max(1, Math.min(100, limit)) });
  const results: Record<string, string> = {};
  for (const o of pendings) {
    try {
      let text = "";
      const payloadStr = (o as any).payload as any as string | null;
      let payloadObj: any = undefined;
      if (payloadStr) { try { payloadObj = JSON.parse(payloadStr); } catch {} }
      if (o.templateId) {
        const tpl = await prisma.waTemplate.findUnique({ where: { id: o.templateId } });
        text = compile(tpl?.content || "", payloadObj);
      } else {
        const payload = payloadObj;
        text = (payload && payload.text) ? String(payload.text) : JSON.stringify(payload || {});
      }
      const sent = await sendWa(o.to, text);
      await prisma.waOutbox.update({ where: { id: o.id }, data: { status: "SENT", providerMsgId: sent.providerMsgId, sentAt: new Date(), attempts: { increment: 1 }, nextAttemptAt: null } });
      results[o.id] = "SENT";
    } catch {
      const attempts = o.attempts ?? 0;
      const delayMinutes = Math.min(60, Math.pow(2, attempts) || 1); // 1,2,4,8,16,32,60
      const next = new Date(Date.now() + delayMinutes * 60000);
      await prisma.waOutbox.update({ where: { id: o.id }, data: { status: "PENDING", attempts: { increment: 1 }, nextAttemptAt: next } });
      results[o.id] = "RETRY";
    }
  }
  return NextResponse.json({ processed: Object.keys(results).length, results });
}
