import { NextRequest, NextResponse } from "next/server";
import { processEmailOutbox, processWaOutbox } from "@/server/notifications/outbox";
import { processDapodikSyncQueue } from "@/server/integrations/dapodik/dapodik.queue";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const key = req.headers.get("x-cron-key");
    if (key !== secret) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const limit = Number(req.nextUrl.searchParams.get("limit") || "50");
  const [wa, email, dapodik] = await Promise.all([processWaOutbox(limit), processEmailOutbox(limit), processDapodikSyncQueue(limit)]);
  return NextResponse.json({ ok: true, wa, email, dapodik });
}
