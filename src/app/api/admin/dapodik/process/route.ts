import { NextRequest, NextResponse } from "next/server";
import { processDapodikSyncQueue } from "@/server/integrations/dapodik/dapodik.queue";

export async function POST(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
  const result = await processDapodikSyncQueue(limit);
  return NextResponse.json({ ok: true, ...result });
}

