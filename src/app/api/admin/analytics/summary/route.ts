import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/server/analytics/summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const summary = await getAnalyticsSummary();
  return NextResponse.json({ ok: true, summary });
}

