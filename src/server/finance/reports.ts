import type {
  CashBankAccount,
  FinanceAccountType,
  OperationalTxnKind,
  PrismaClient,
} from "@/generated/prisma";

export type ResolvedFinanceRange = {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
};

export function resolveFinanceRange(searchParams: URLSearchParams): ResolvedFinanceRange {
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  defaultEnd.setHours(23, 59, 59, 999);

  const startInput = searchParams.get("start");
  const endInput = searchParams.get("end");
  const start = startInput ? new Date(startInput) : defaultStart;
  const end = endInput ? new Date(endInput) : defaultEnd;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date range");
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (end < start) throw new Error("end must be greater than or equal to start");

  return {
    start,
    end,
    startStr: start.toISOString().slice(0, 10),
    endStr: end.toISOString().slice(0, 10),
  };
}

export function operationalDelta(kind: OperationalTxnKind, amount: number) {
  if (kind === "EXPENSE" || kind === "TRANSFER_OUT") return -Math.abs(amount);
  return Math.abs(amount);
}

function dateKey(date: Date, groupBy: "daily" | "monthly") {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  if (groupBy === "monthly") return `${yyyy}-${mm}`;
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function accountTypeFlowSection(accountType: FinanceAccountType, category: string | null) {
  const normalizedCategory = (category ?? "").toLowerCase();
  if (normalizedCategory.includes("invest")) return "INVESTING" as const;
  if (
    normalizedCategory.includes("pendanaan") ||
    normalizedCategory.includes("financing") ||
    accountType === "LIABILITY" ||
    accountType === "EQUITY"
  ) {
    return "FINANCING" as const;
  }
  return "OPERATING" as const;
}

export function csvCell(value: unknown) {
  const str = value == null ? "" : String(value);
  return `"${str.replaceAll(`"`, `""`)}"`;
}

type CashBookInput = {
  start: Date;
  end: Date;
  groupBy: "daily" | "monthly";
  cashBankAccountId?: string;
};

export async function buildCashBookReport(db: PrismaClient, input: CashBookInput) {
  const accountWhere = input.cashBankAccountId ? { id: input.cashBankAccountId } : {};
  const accounts = await db.cashBankAccount.findMany({
    where: accountWhere,
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      openingBalance: true,
      balance: true,
      isActive: true,
    },
    orderBy: [{ type: "asc" }, { code: "asc" }],
  });
  if (input.cashBankAccountId && accounts.length === 0) {
    throw new Error("Cash/bank account not found");
  }
  if (accounts.length === 0) {
    return {
      period: {
        start: input.start.toISOString().slice(0, 10),
        end: input.end.toISOString().slice(0, 10),
      },
      filter: {
        groupBy: input.groupBy,
        cashBankAccountId: input.cashBankAccountId ?? null,
      },
      openingBalance: 0,
      closingBalance: 0,
      totals: { inflow: 0, outflow: 0, net: 0, transactionCount: 0 },
      entries: [] as Array<{
        id: string;
        date: string;
        kind: OperationalTxnKind;
        accountCode: string;
        accountName: string;
        cashBankCode: string;
        cashBankName: string;
        amount: number;
        inflow: number;
        outflow: number;
        delta: number;
        runningBalance: number;
        description: string | null;
        referenceNo: string | null;
      }>,
      grouped: [] as Array<{
        periodKey: string;
        inflow: number;
        outflow: number;
        net: number;
        transactionCount: number;
        closingBalance: number;
      }>,
    };
  }

  const accountIds = accounts.map((row) => row.id);
  const beforeRows = await db.operationalTxn.findMany({
    where: {
      approvalStatus: "APPROVED",
      cashBankAccountId: { in: accountIds },
      txnDate: { lt: input.start },
    },
    select: {
      cashBankAccountId: true,
      kind: true,
      amount: true,
    },
  });

  const baseOpeningByAccount = new Map<string, number>();
  for (const account of accounts) {
    baseOpeningByAccount.set(account.id, account.openingBalance);
  }
  for (const row of beforeRows) {
    const current = baseOpeningByAccount.get(row.cashBankAccountId) ?? 0;
    baseOpeningByAccount.set(
      row.cashBankAccountId,
      current + operationalDelta(row.kind, row.amount)
    );
  }

  const openingBalance = Array.from(baseOpeningByAccount.values()).reduce(
    (acc, val) => acc + val,
    0
  );

  const rows = await db.operationalTxn.findMany({
    where: {
      approvalStatus: "APPROVED",
      cashBankAccountId: { in: accountIds },
      txnDate: { gte: input.start, lte: input.end },
    },
    select: {
      id: true,
      txnDate: true,
      kind: true,
      amount: true,
      description: true,
      referenceNo: true,
      account: { select: { code: true, name: true } },
      cashBankAccount: { select: { code: true, name: true } },
    },
    orderBy: [{ txnDate: "asc" }, { createdAt: "asc" }],
  });

  const entries: Array<{
    id: string;
    date: string;
    kind: OperationalTxnKind;
    accountCode: string;
    accountName: string;
    cashBankCode: string;
    cashBankName: string;
    amount: number;
    inflow: number;
    outflow: number;
    delta: number;
    runningBalance: number;
    description: string | null;
    referenceNo: string | null;
  }> = [];

  const groupedMap = new Map<
    string,
    { periodKey: string; inflow: number; outflow: number; net: number; transactionCount: number }
  >();

  let runningBalance = openingBalance;
  let inflowTotal = 0;
  let outflowTotal = 0;
  for (const row of rows) {
    const delta = operationalDelta(row.kind, row.amount);
    const inflow = delta > 0 ? delta : 0;
    const outflow = delta < 0 ? Math.abs(delta) : 0;
    inflowTotal += inflow;
    outflowTotal += outflow;
    runningBalance += delta;

    entries.push({
      id: row.id,
      date: row.txnDate.toISOString().slice(0, 10),
      kind: row.kind,
      accountCode: row.account.code,
      accountName: row.account.name,
      cashBankCode: row.cashBankAccount.code,
      cashBankName: row.cashBankAccount.name,
      amount: row.amount,
      inflow,
      outflow,
      delta,
      runningBalance,
      description: row.description ?? null,
      referenceNo: row.referenceNo ?? null,
    });

    const key = dateKey(row.txnDate, input.groupBy);
    const existing = groupedMap.get(key);
    if (!existing) {
      groupedMap.set(key, {
        periodKey: key,
        inflow,
        outflow,
        net: delta,
        transactionCount: 1,
      });
    } else {
      existing.inflow += inflow;
      existing.outflow += outflow;
      existing.net += delta;
      existing.transactionCount += 1;
    }
  }

  let groupedRunningBalance = openingBalance;
  const grouped = Array.from(groupedMap.values())
    .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
    .map((row) => {
      groupedRunningBalance += row.net;
      return {
        ...row,
        closingBalance: groupedRunningBalance,
      };
    });

  return {
    period: {
      start: input.start.toISOString().slice(0, 10),
      end: input.end.toISOString().slice(0, 10),
    },
    filter: {
      groupBy: input.groupBy,
      cashBankAccountId: input.cashBankAccountId ?? null,
    },
    openingBalance,
    closingBalance: runningBalance,
    totals: {
      inflow: inflowTotal,
      outflow: outflowTotal,
      net: inflowTotal - outflowTotal,
      transactionCount: rows.length,
    },
    entries,
    grouped,
  };
}

type CashFlowInput = {
  start: Date;
  end: Date;
};

export async function buildCashFlowReport(db: PrismaClient, input: CashFlowInput) {
  const rows = await db.operationalTxn.findMany({
    where: {
      approvalStatus: "APPROVED",
      txnDate: { gte: input.start, lte: input.end },
    },
    select: {
      id: true,
      txnDate: true,
      kind: true,
      amount: true,
      accountId: true,
      account: { select: { code: true, name: true, type: true, category: true } },
    },
    orderBy: [{ txnDate: "asc" }, { createdAt: "asc" }],
  });

  const sections = {
    OPERATING: new Map<
      string,
      {
        accountId: string;
        accountCode: string;
        accountName: string;
        inflow: number;
        outflow: number;
        txCount: number;
      }
    >(),
    INVESTING: new Map<
      string,
      {
        accountId: string;
        accountCode: string;
        accountName: string;
        inflow: number;
        outflow: number;
        txCount: number;
      }
    >(),
    FINANCING: new Map<
      string,
      {
        accountId: string;
        accountCode: string;
        accountName: string;
        inflow: number;
        outflow: number;
        txCount: number;
      }
    >(),
  };
  let internalTransferIn = 0;
  let internalTransferOut = 0;

  for (const row of rows) {
    if (row.kind === "TRANSFER_IN") {
      internalTransferIn += row.amount;
      continue;
    }
    if (row.kind === "TRANSFER_OUT") {
      internalTransferOut += row.amount;
      continue;
    }

    const section = accountTypeFlowSection(row.account.type, row.account.category);
    const bucket = sections[section];
    const current =
      bucket.get(row.accountId) ?? {
        accountId: row.accountId,
        accountCode: row.account.code,
        accountName: row.account.name,
        inflow: 0,
        outflow: 0,
        txCount: 0,
      };
    if (row.kind === "INCOME") current.inflow += row.amount;
    if (row.kind === "EXPENSE") current.outflow += row.amount;
    current.txCount += 1;
    bucket.set(row.accountId, current);
  }

  function normalizeSection(
    name: "OPERATING" | "INVESTING" | "FINANCING",
    bucket: Map<
      string,
      {
        accountId: string;
        accountCode: string;
        accountName: string;
        inflow: number;
        outflow: number;
        txCount: number;
      }
    >
  ) {
    const items = Array.from(bucket.values())
      .map((row) => ({ ...row, net: row.inflow - row.outflow }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
    const inflow = items.reduce((acc, row) => acc + row.inflow, 0);
    const outflow = items.reduce((acc, row) => acc + row.outflow, 0);
    return {
      name,
      inflow,
      outflow,
      net: inflow - outflow,
      transactionCount: items.reduce((acc, row) => acc + row.txCount, 0),
      items,
    };
  }

  const normalizedSections = [
    normalizeSection("OPERATING", sections.OPERATING),
    normalizeSection("INVESTING", sections.INVESTING),
    normalizeSection("FINANCING", sections.FINANCING),
  ];
  const totals = normalizedSections.reduce(
    (acc, section) => {
      acc.inflow += section.inflow;
      acc.outflow += section.outflow;
      return acc;
    },
    { inflow: 0, outflow: 0 }
  );

  return {
    period: {
      start: input.start.toISOString().slice(0, 10),
      end: input.end.toISOString().slice(0, 10),
    },
    sections: normalizedSections,
    internalTransfers: {
      inflow: internalTransferIn,
      outflow: internalTransferOut,
      net: internalTransferIn - internalTransferOut,
    },
    totals: {
      inflow: totals.inflow,
      outflow: totals.outflow,
      net: totals.inflow - totals.outflow,
    },
  };
}

type ReconciliationInput = {
  start: Date;
  end: Date;
  cashBankAccountId?: string;
};

type ReconciliationRow = {
  id: string;
  code: string;
  name: string;
  type: CashBankAccount["type"];
  openingConfigured: number;
  openingAtStart: number;
  periodInflow: number;
  periodOutflow: number;
  periodNet: number;
  closingAtEndRange: number;
  ledgerBalanceCurrent: number;
  balanceSnapshot: number;
  varianceCurrent: number;
};

export async function buildReconciliationReport(
  db: PrismaClient,
  input: ReconciliationInput
) {
  const accountWhere = input.cashBankAccountId ? { id: input.cashBankAccountId } : {};
  const accounts = await db.cashBankAccount.findMany({
    where: accountWhere,
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      openingBalance: true,
      balance: true,
    },
    orderBy: [{ type: "asc" }, { code: "asc" }],
  });
  if (input.cashBankAccountId && accounts.length === 0) {
    throw new Error("Cash/bank account not found");
  }
  if (accounts.length === 0) {
    return {
      period: {
        start: input.start.toISOString().slice(0, 10),
        end: input.end.toISOString().slice(0, 10),
      },
      filter: { cashBankAccountId: input.cashBankAccountId ?? null },
      rows: [] as ReconciliationRow[],
      totals: {
        openingAtStart: 0,
        periodInflow: 0,
        periodOutflow: 0,
        periodNet: 0,
        closingAtEndRange: 0,
        ledgerBalanceCurrent: 0,
        balanceSnapshot: 0,
        varianceCurrent: 0,
      },
    };
  }

  const accountIds = accounts.map((row) => row.id);
  const txnRows = await db.operationalTxn.findMany({
    where: {
      approvalStatus: "APPROVED",
      cashBankAccountId: { in: accountIds },
    },
    select: {
      cashBankAccountId: true,
      kind: true,
      amount: true,
      txnDate: true,
    },
  });

  const map = new Map<
    string,
    {
      before: number;
      rangeInflow: number;
      rangeOutflow: number;
      allDelta: number;
    }
  >();
  for (const account of accounts) {
    map.set(account.id, { before: 0, rangeInflow: 0, rangeOutflow: 0, allDelta: 0 });
  }

  for (const row of txnRows) {
    const tracker = map.get(row.cashBankAccountId);
    if (!tracker) continue;
    const delta = operationalDelta(row.kind, row.amount);
    tracker.allDelta += delta;
    if (row.txnDate < input.start) {
      tracker.before += delta;
      continue;
    }
    if (row.txnDate <= input.end) {
      if (delta > 0) tracker.rangeInflow += delta;
      if (delta < 0) tracker.rangeOutflow += Math.abs(delta);
    }
  }

  const rows: ReconciliationRow[] = accounts.map((account) => {
    const tracker = map.get(account.id) ?? {
      before: 0,
      rangeInflow: 0,
      rangeOutflow: 0,
      allDelta: 0,
    };
    const openingAtStart = account.openingBalance + tracker.before;
    const periodNet = tracker.rangeInflow - tracker.rangeOutflow;
    const closingAtEndRange = openingAtStart + periodNet;
    const ledgerBalanceCurrent = account.openingBalance + tracker.allDelta;
    const varianceCurrent = account.balance - ledgerBalanceCurrent;
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      openingConfigured: account.openingBalance,
      openingAtStart,
      periodInflow: tracker.rangeInflow,
      periodOutflow: tracker.rangeOutflow,
      periodNet,
      closingAtEndRange,
      ledgerBalanceCurrent,
      balanceSnapshot: account.balance,
      varianceCurrent,
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.openingAtStart += row.openingAtStart;
      acc.periodInflow += row.periodInflow;
      acc.periodOutflow += row.periodOutflow;
      acc.periodNet += row.periodNet;
      acc.closingAtEndRange += row.closingAtEndRange;
      acc.ledgerBalanceCurrent += row.ledgerBalanceCurrent;
      acc.balanceSnapshot += row.balanceSnapshot;
      acc.varianceCurrent += row.varianceCurrent;
      return acc;
    },
    {
      openingAtStart: 0,
      periodInflow: 0,
      periodOutflow: 0,
      periodNet: 0,
      closingAtEndRange: 0,
      ledgerBalanceCurrent: 0,
      balanceSnapshot: 0,
      varianceCurrent: 0,
    }
  );

  return {
    period: {
      start: input.start.toISOString().slice(0, 10),
      end: input.end.toISOString().slice(0, 10),
    },
    filter: { cashBankAccountId: input.cashBankAccountId ?? null },
    rows,
    totals,
  };
}
