import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAnalyticsSummary } from "@/server/analytics/summary";
import { requireApiPermission } from "@/server/api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, ["analytics.read"]);
  if (!auth.ok) return auth.response;

  const summary = await getAnalyticsSummary();
  return NextResponse.json({ ok: true, summary });
}
