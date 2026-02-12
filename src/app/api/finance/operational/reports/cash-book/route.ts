import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveFinanceRange, buildCashBookReport } from "@/server/finance/reports";

export async function GET(req: NextRequest) {
  try {
    const range = resolveFinanceRange(req.nextUrl.searchParams);
    const groupByParam = req.nextUrl.searchParams.get("groupBy") ?? "daily";
    const groupBy = groupByParam === "monthly" ? "monthly" : "daily";
    const cashBankAccountId = req.nextUrl.searchParams.get("cashBankAccountId") || undefined;

    const report = await buildCashBookReport(prisma, {
      start: range.start,
      end: range.end,
      groupBy,
      cashBankAccountId,
    });
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate cash book report" },
      { status: 400 }
    );
  }
}

