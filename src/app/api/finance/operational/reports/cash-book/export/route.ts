import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  resolveFinanceRange,
  buildCashBookReport,
  csvCell,
} from "@/server/finance/reports";

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

    const header = [
      "Date",
      "Kind",
      "AccountCode",
      "AccountName",
      "CashBankCode",
      "CashBankName",
      "Amount",
      "Inflow",
      "Outflow",
      "Delta",
      "RunningBalance",
      "ReferenceNo",
      "Description",
    ].join(",");

    const lines = report.entries.map((row) =>
      [
        csvCell(row.date),
        csvCell(row.kind),
        csvCell(row.accountCode),
        csvCell(row.accountName),
        csvCell(row.cashBankCode),
        csvCell(row.cashBankName),
        row.amount,
        row.inflow,
        row.outflow,
        row.delta,
        row.runningBalance,
        csvCell(row.referenceNo ?? ""),
        csvCell(row.description ?? ""),
      ].join(",")
    );

    const csv = `\uFEFF${[header, ...lines].join("\n")}`;
    const filename = `cash_book_${range.startStr}_to_${range.endStr}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export cash book report" },
      { status: 400 }
    );
  }
}

