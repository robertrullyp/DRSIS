import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveFinanceRange } from "@/server/finance/reports";
import { FinanceBudgetKind, OperationalTxnKind } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";

function keyExact(kind: string, accountId: string, cashBankAccountId: string | null) {
  return `${kind}|${accountId}|${cashBankAccountId ?? ""}`;
}

function keyAccount(kind: string, accountId: string) {
  return `${kind}|${accountId}`;
}

export async function GET(req: NextRequest) {
  try {
    const range = resolveFinanceRange(req.nextUrl.searchParams);
    const kindParam = req.nextUrl.searchParams.get("kind");
    const kindSingle =
      kindParam === FinanceBudgetKind.INCOME || kindParam === FinanceBudgetKind.EXPENSE
        ? kindParam
        : null;
    const budgetKinds: FinanceBudgetKind[] = kindSingle
      ? [kindSingle as FinanceBudgetKind]
      : [FinanceBudgetKind.INCOME, FinanceBudgetKind.EXPENSE];
    const txnKinds: OperationalTxnKind[] = kindSingle
      ? [kindSingle as OperationalTxnKind]
      : [OperationalTxnKind.INCOME, OperationalTxnKind.EXPENSE];
    const cashBankAccountIdFilter =
      req.nextUrl.searchParams.get("cashBankAccountId") || undefined;

    const budgetWhere: Prisma.FinanceBudgetWhereInput = {
      kind: { in: budgetKinds },
      AND: [{ periodStart: { lte: range.end } }, { periodEnd: { gte: range.start } }],
    };
    if (cashBankAccountIdFilter) {
      budgetWhere.OR = [
        { cashBankAccountId: cashBankAccountIdFilter },
        { cashBankAccountId: null },
      ];
    }

    const budgets = await prisma.financeBudget.findMany({
      where: budgetWhere,
      select: {
        id: true,
        kind: true,
        amount: true,
        accountId: true,
        cashBankAccountId: true,
      },
    });

    const actualWhere: Prisma.OperationalTxnWhereInput = {
      approvalStatus: "APPROVED",
      txnDate: { gte: range.start, lte: range.end },
      kind: { in: txnKinds },
    };
    if (cashBankAccountIdFilter) {
      actualWhere.cashBankAccountId = cashBankAccountIdFilter;
    }

    const actualAgg = await prisma.operationalTxn.groupBy({
      by: ["kind", "accountId", "cashBankAccountId"],
      where: actualWhere,
      _sum: { amount: true },
    });

    const actualExact = new Map<string, number>();
    const actualByAccount = new Map<string, number>();

    for (const row of actualAgg) {
      const amount = row._sum.amount ?? 0;
      const exactKey = keyExact(row.kind, row.accountId, row.cashBankAccountId);
      actualExact.set(exactKey, (actualExact.get(exactKey) ?? 0) + amount);

      const accountKey = keyAccount(row.kind, row.accountId);
      actualByAccount.set(accountKey, (actualByAccount.get(accountKey) ?? 0) + amount);
    }

    const budgetAgg = new Map<string, { kind: string; accountId: string; cashBankAccountId: string | null; budget: number }>();
    for (const row of budgets) {
      const key = keyExact(row.kind, row.accountId, row.cashBankAccountId);
      const existing = budgetAgg.get(key);
      if (!existing) {
        budgetAgg.set(key, {
          kind: row.kind,
          accountId: row.accountId,
          cashBankAccountId: row.cashBankAccountId,
          budget: row.amount,
        });
      } else {
        existing.budget += row.amount;
      }
    }

    // Include actual-only rows (unbudgeted) at account granularity.
    const rowKeys = new Set<string>();
    for (const key of budgetAgg.keys()) rowKeys.add(key);
    for (const row of actualAgg) {
      const k = keyExact(row.kind, row.accountId, row.cashBankAccountId);
      if (!rowKeys.has(k)) {
        budgetAgg.set(k, {
          kind: row.kind,
          accountId: row.accountId,
          cashBankAccountId: row.cashBankAccountId,
          budget: 0,
        });
      }
    }

    const accountIds = Array.from(
      new Set(Array.from(budgetAgg.values()).map((row) => row.accountId))
    );
    const cashBankIds = Array.from(
      new Set(
        Array.from(budgetAgg.values())
          .map((row) => row.cashBankAccountId)
          .filter((id): id is string => Boolean(id))
      )
    );

    const [accounts, cashBanks] = await Promise.all([
      prisma.financeAccount.findMany({
        where: { id: { in: accountIds } },
        select: { id: true, code: true, name: true, type: true, category: true },
      }),
      cashBankIds.length
        ? prisma.cashBankAccount.findMany({
            where: { id: { in: cashBankIds } },
            select: { id: true, code: true, name: true, type: true },
          })
        : Promise.resolve([]),
    ]);

    const accountMap = new Map(accounts.map((row) => [row.id, row]));
    const cashBankMap = new Map(cashBanks.map((row) => [row.id, row]));

    const items = Array.from(budgetAgg.values())
      .map((row) => {
        const budgetKey = keyExact(row.kind, row.accountId, row.cashBankAccountId);
        const actual =
          row.cashBankAccountId == null
            ? actualByAccount.get(keyAccount(row.kind, row.accountId)) ?? 0
            : actualExact.get(budgetKey) ?? 0;
        const variance = actual - row.budget;
        const variancePct =
          row.budget > 0 ? Math.round((variance / row.budget) * 10_000) / 100 : null;
        return {
          kind: row.kind,
          account: accountMap.get(row.accountId) ?? { id: row.accountId, code: row.accountId, name: "Unknown", type: "EXPENSE", category: null },
          cashBankAccount:
            row.cashBankAccountId == null
              ? null
              : cashBankMap.get(row.cashBankAccountId) ?? { id: row.cashBankAccountId, code: row.cashBankAccountId, name: "Unknown", type: "CASH" },
          budgetAmount: row.budget,
          actualAmount: actual,
          variance,
          variancePct,
        };
      })
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
        return a.account.code.localeCompare(b.account.code);
      });

    const totals = items.reduce(
      (acc, row) => {
        acc.budget += row.budgetAmount;
        acc.actual += row.actualAmount;
        acc.variance += row.variance;
        return acc;
      },
      { budget: 0, actual: 0, variance: 0 }
    );

    return NextResponse.json({
      period: { start: range.startStr, end: range.endStr },
      filter: { kind: kindParam ?? null, cashBankAccountId: cashBankAccountIdFilter ?? null },
      items,
      totals,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate budget report" },
      { status: 400 }
    );
  }
}
