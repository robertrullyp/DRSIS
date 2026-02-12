import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const startStr = req.nextUrl.searchParams.get("start");
  const endStr = req.nextUrl.searchParams.get("end");
  const where: Record<string, unknown> = {};
  if (startStr && endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      where.txnDate = { gte: start, lte: end };
    }
  }

  const [incomeAgg, expenseAgg, transferInAgg, transferOutAgg, latest, balances] =
    await Promise.all([
      prisma.operationalTxn.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { ...where, kind: "INCOME", approvalStatus: "APPROVED" },
      }),
      prisma.operationalTxn.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { ...where, kind: "EXPENSE", approvalStatus: "APPROVED" },
      }),
      prisma.operationalTxn.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { ...where, kind: "TRANSFER_IN", approvalStatus: "APPROVED" },
      }),
      prisma.operationalTxn.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { ...where, kind: "TRANSFER_OUT", approvalStatus: "APPROVED" },
      }),
      prisma.operationalTxn.findMany({
        where,
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
          cashBankAccount: {
            select: { id: true, code: true, name: true, type: true, balance: true },
          },
        },
        orderBy: [{ txnDate: "desc" }, { createdAt: "desc" }],
        take: 10,
      }),
      prisma.cashBankAccount.findMany({
        where: { isActive: true },
        orderBy: [{ type: "asc" }, { code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          openingBalance: true,
          balance: true,
        },
      }),
    ]);

  const income = incomeAgg._sum.amount ?? 0;
  const expense = expenseAgg._sum.amount ?? 0;
  const transferIn = transferInAgg._sum.amount ?? 0;
  const transferOut = transferOutAgg._sum.amount ?? 0;
  const netOperational = income - expense;
  const totalCashBankBalance = balances.reduce((acc, row) => acc + row.balance, 0);

  return NextResponse.json({
    period: { start: startStr, end: endStr },
    totals: {
      income,
      expense,
      transferIn,
      transferOut,
      netOperational,
      totalCashBankBalance,
    },
    counts: {
      income: incomeAgg._count._all,
      expense: expenseAgg._count._all,
      transferIn: transferInAgg._count._all,
      transferOut: transferOutAgg._count._all,
    },
    balances,
    latest,
  });
}
