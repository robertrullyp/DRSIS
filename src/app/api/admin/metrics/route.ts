import { NextResponse } from "next/server";
import { getHttpMetricsSnapshot } from "@/server/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, metrics: getHttpMetricsSnapshot() });
}

