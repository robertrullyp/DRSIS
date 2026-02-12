import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveFinanceRange, buildCashFlowReport } from "@/server/finance/reports";

export async function GET(req: NextRequest) {
  try {
    const range = resolveFinanceRange(req.nextUrl.searchParams);
    const report = await buildCashFlowReport(prisma, {
      start: range.start,
      end: range.end,
    });
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate cash flow report" },
      { status: 400 }
    );
  }
}

