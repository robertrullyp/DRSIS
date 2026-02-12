import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildReconciliationReport,
  resolveFinanceRange,
} from "@/server/finance/reports";

export async function GET(req: NextRequest) {
  try {
    const range = resolveFinanceRange(req.nextUrl.searchParams);
    const cashBankAccountId = req.nextUrl.searchParams.get("cashBankAccountId") || undefined;
    const report = await buildReconciliationReport(prisma, {
      start: range.start,
      end: range.end,
      cashBankAccountId,
    });
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate reconciliation report",
      },
      { status: 400 }
    );
  }
}

