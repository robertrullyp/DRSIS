import { NextRequest, NextResponse } from "next/server";
import { dapodikStagingListQuerySchema } from "@/server/integrations/dapodik/dapodik.dto";
import { listDapodikStagingRows } from "@/server/integrations/dapodik/dapodik.staging";

export async function GET(req: NextRequest) {
  const parsed = dapodikStagingListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const data = await listDapodikStagingRows(parsed.data);
  return NextResponse.json(data);
}

