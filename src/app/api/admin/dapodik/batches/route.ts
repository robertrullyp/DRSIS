import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dapodikBatchListQuerySchema, dapodikSyncEnqueueSchema } from "@/server/integrations/dapodik/dapodik.dto";
import { enqueueDapodikSyncBatch, listDapodikSyncBatches } from "@/server/integrations/dapodik/dapodik.queue";

export async function GET(req: NextRequest) {
  const parsed = dapodikBatchListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const data = await listDapodikSyncBatches(parsed.data);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = dapodikSyncEnqueueSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const created = await enqueueDapodikSyncBatch(parsed.data.kind, userId);
  return NextResponse.json(created, { status: 201 });
}

