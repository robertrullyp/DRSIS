import { NextRequest, NextResponse } from "next/server";
import { processDapodikSyncQueue } from "@/server/integrations/dapodik/dapodik.queue";
import { requireApiPermission } from "@/server/api/auth";

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, ["dapodik.manage"]);
  if (!auth.ok) return auth.response;

  const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
  const result = await processDapodikSyncQueue(limit);
  return NextResponse.json({ ok: true, ...result });
}
