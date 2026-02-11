import { NextRequest, NextResponse } from "next/server";
import { queueWa } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const to = String(body?.to || "").trim();
  const key = String(body?.key || "").trim();
  if (!to || !key) return NextResponse.json({ error: "to and key required" }, { status: 400 });
  let payload: any = undefined;
  if (body?.payload) {
    try { payload = typeof body.payload === "string" ? JSON.parse(body.payload) : body.payload; } catch {}
  }
  const out = await queueWa(to, key, payload);
  return NextResponse.json({ queued: Boolean(out), id: out?.id });
}

