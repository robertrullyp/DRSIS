import { NextRequest, NextResponse } from "next/server";
import { dapodikBatchListQuerySchema, dapodikSyncEnqueueSchema } from "@/server/integrations/dapodik/dapodik.dto";
import { enqueueDapodikSyncBatch, listDapodikSyncBatches } from "@/server/integrations/dapodik/dapodik.queue";
import { requireApiPermission } from "@/server/api/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, ["dapodik.manage"]);
  if (!auth.ok) return auth.response;

  const parsed = dapodikBatchListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const data = await listDapodikSyncBatches(parsed.data);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, ["dapodik.manage"]);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = dapodikSyncEnqueueSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const created = await enqueueDapodikSyncBatch(parsed.data.kind, auth.context.userId);
  return NextResponse.json(created, { status: 201 });
}
