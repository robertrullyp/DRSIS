import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const key = req.headers.get("x-cron-key");
    if (key !== secret) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const base = new URL(req.url);
  const origin = `${base.protocol}//${base.host}`;
  // Fire-and-forget both senders (best-effort)
  await Promise.allSettled([
    fetch(`${origin}/api/admin/wa/outbox/send?limit=50`, { method: "POST" }),
    fetch(`${origin}/api/admin/email/outbox/send?limit=50`, { method: "POST" }),
  ]);
  return NextResponse.json({ ok: true });
}
