import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/server/api/auth";
import {
  analyticsSnapshotCaptureSchema,
  analyticsSnapshotListQuerySchema,
  captureAnalyticsSnapshot,
  listAnalyticsSnapshots,
} from "@/server/analytics/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, ["analytics.read"]);
  if (!auth.ok) return auth.response;

  const parsed = analyticsSnapshotListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const data = await listAnalyticsSnapshots(parsed.data);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, ["analytics.write"]);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const parsed = analyticsSnapshotCaptureSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const created = await captureAnalyticsSnapshot(parsed.data, auth.context.userId);
  return NextResponse.json(created, { status: 201 });
}
