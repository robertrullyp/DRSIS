import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnalyticsTimeseries } from "@/server/analytics/timeseries";
import { requireApiPermission } from "@/server/api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  days: z.coerce.number().int().min(7).max(90).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, ["analytics.read"]);
  if (!auth.ok) return auth.response;

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const days = parsed.data.days ?? 14;
  const series = await getAnalyticsTimeseries(days);
  return NextResponse.json({ ok: true, series });
}
