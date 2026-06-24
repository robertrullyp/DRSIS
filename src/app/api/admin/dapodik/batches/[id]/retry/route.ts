import { NextRequest, NextResponse } from "next/server";
import { retryDapodikSyncBatch } from "@/server/integrations/dapodik/dapodik.queue";
import { requireApiPermission } from "@/server/api/auth";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(req, ["dapodik.manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const updated = await retryDapodikSyncBatch(id, auth.context.userId);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
