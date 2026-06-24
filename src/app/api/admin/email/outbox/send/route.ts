import { NextRequest, NextResponse } from "next/server";
import { processEmailOutbox } from "@/server/notifications/outbox";
import { requireApiPermission } from "@/server/api/auth";

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, ["notification.manage"]);
  if (!auth.ok) return auth.response;

  const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
  const result = await processEmailOutbox(limit);
  return NextResponse.json(result);
}
