import { NextRequest, NextResponse } from "next/server";
import { dapodikStagingListQuerySchema } from "@/server/integrations/dapodik/dapodik.dto";
import { listDapodikStagingRows } from "@/server/integrations/dapodik/dapodik.staging";
import { requireApiPermission } from "@/server/api/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, ["dapodik.manage"]);
  if (!auth.ok) return auth.response;

  const parsed = dapodikStagingListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const data = await listDapodikStagingRows(parsed.data);
  return NextResponse.json(data);
}
