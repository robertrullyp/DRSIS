import { NextResponse } from "next/server";
import { getInvoiceOutstandingByAcademicYear } from "@/server/analytics/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getInvoiceOutstandingByAcademicYear();
  return NextResponse.json({ ok: true, items });
}

