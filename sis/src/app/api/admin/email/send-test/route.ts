import { NextRequest, NextResponse } from "next/server";
import { queueEmail } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const to = String(body?.to || "").trim();
  const key = String(body?.key || "").trim();
  const subject = body?.subject ? String(body.subject) : undefined;
  if (!to || !key) return NextResponse.json({ error: "to and key required" }, { status: 400 });
  let payload: any = undefined;
  if (body?.payload) {
    try { payload = typeof body.payload === "string" ? JSON.parse(body.payload) : body.payload; } catch {}
  }
  const out = await queueEmail(to, key, payload, subject);
  return NextResponse.json({ queued: Boolean(out), id: out?.id });
}

