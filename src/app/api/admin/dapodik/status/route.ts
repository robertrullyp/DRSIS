import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/server/api/auth";
import { getDapodikConnectorStatus } from "@/server/integrations/dapodik/dapodik.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, ["dapodik.manage"]);
  if (!auth.ok) return auth.response;

  return NextResponse.json(getDapodikConnectorStatus());
}
