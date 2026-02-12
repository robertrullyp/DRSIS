"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CashBookReport = {
  period: { start: string; end: string };
  filter: { groupBy: "daily" | "monthly"; cashBankAccountId: string | null };
  openingBalance: number;
  closingBalance: number;
  totals: { inflow: number; outflow: number; net: number; transactionCount: number };
  grouped: Array<{
    periodKey: string;
    inflow: number;
    outflow: number;
    net: number;
    transactionCount: number;
    closingBalance: number;
  }>;
  entries: Array<{
    id: string;
    date: string;
    kind: "INCOME" | "EXPENSE" | "TRANSFER_IN" | "TRANSFER_OUT";
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
  }>;
};

type CashFlowSection = {
  name: "OPERATING" | "INVESTING" | "FINANCING";
  inflow: number;
  outflow: number;
  net: number;
  transactionCount: number;
  items: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    inflow: number;
    outflow: number;
    net: number;
    txCount: number;
  }>;
};

type CashFlowReport = {
  period: { start: string; end: string };
  sections: CashFlowSection[];
  internalTransfers: { inflow: number; outflow: number; net: number };
  totals: { inflow: number; outflow: number; net: number };
};

type ReconciliationReport = {
  period: { start: string; end: string };
  rows: Array<{
    id: string;
    code: string;
    name: string;
    type: "CASH" | "BANK";
    openingConfigured: number;
    openingAtStart: number;
    periodInflow: number;
    periodOutflow: number;
    periodNet: number;
    closingAtEndRange: number;
    ledgerBalanceCurrent: number;
    balanceSnapshot: number;
    varianceCurrent: number;
  }>;
  totals: {
    openingAtStart: number;
    periodInflow: number;
    periodOutflow: number;
    periodNet: number;
    closingAtEndRange: number;
    ledgerBalanceCurrent: number;
    balanceSnapshot: number;
    varianceCurrent: number;
  };
};

type BudgetVsActualReport = {
  period: { start: string; end: string };
  filter: { kind: string | null; cashBankAccountId: string | null };
  totals: { budget: number; actual: number; variance: number };
  items: Array<{
    kind: "INCOME" | "EXPENSE";
    account: { id: string; code: string; name: string; type: string; category: string | null };
    cashBankAccount: { id: string; code: string; name: string; type: "CASH" | "BANK" } | null;
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    variancePct: number | null;
  }>;
};

type CashBankOption = {
  id: string;
  code: string;
  name: string;
  type: "CASH" | "BANK";
};

function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildQuery(
  input: Record<string, string | null | undefined | "daily" | "monthly">
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (!value) continue;
    params.set(key, value);
  }
  return params.toString();
}

export default function FinanceOperationalReportsPage() {
  const today = useMemo(() => new Date(), []);
  const [start, setStart] = useState(
    toDateInput(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [end, setEnd] = useState(toDateInput(today));
  const [groupBy, setGroupBy] = useState<"daily" | "monthly">("daily");
  const [cashBankAccountId, setCashBankAccountId] = useState("");

  const queryString = useMemo(
    () =>
      buildQuery({
        start,
        end,
        groupBy,
        cashBankAccountId: cashBankAccountId || undefined,
      }),
    [start, end, groupBy, cashBankAccountId]
  );
  const reconciliationExportQuery = useMemo(
    () =>
      buildQuery({
        start,
        end,
        cashBankAccountId: cashBankAccountId || undefined,
      }),
    [start, end, cashBankAccountId]
  );

  const { data: cashBanks } = useQuery<{ items: CashBankOption[] }>({
    queryKey: ["finance-operational-cash-bank-options"],
    queryFn: async () =>
      (await (
        await fetch("/api/finance/operational/cash-accounts?pageSize=500&isActive=true")
      ).json()) as { items: CashBankOption[] },
  });

  const cashBookQuery = useQuery<CashBookReport>({
    queryKey: ["finance-operational-report-cash-book", queryString],
    queryFn: async () =>
      (await (
        await fetch(`/api/finance/operational/reports/cash-book?${queryString}`)
      ).json()) as CashBookReport,
  });

  const cashFlowQuery = useQuery<CashFlowReport>({
    queryKey: ["finance-operational-report-cashflow", start, end],
    queryFn: async () =>
      (await (
        await fetch(`/api/finance/operational/reports/cashflow?${buildQuery({ start, end })}`)
      ).json()) as CashFlowReport,
  });

  const reconciliationQuery = useQuery<ReconciliationReport>({
    queryKey: ["finance-operational-report-reconciliation", start, end, cashBankAccountId],
    queryFn: async () =>
      (await (
        await fetch(
          `/api/finance/operational/reports/reconciliation?${buildQuery({
            start,
            end,
            cashBankAccountId: cashBankAccountId || undefined,
          })}`
        )
      ).json()) as ReconciliationReport,
  });

  const budgetVsActualQuery = useQuery<BudgetVsActualReport>({
    queryKey: ["finance-operational-report-budget-vs-actual", start, end, cashBankAccountId],
    queryFn: async () =>
      (await (
        await fetch(
          `/api/finance/operational/reports/budget-vs-actual?${buildQuery({
            start,
            end,
            cashBankAccountId: cashBankAccountId || undefined,
          })}`
        )
      ).json()) as BudgetVsActualReport,
  });

  const isLoading =
    cashBookQuery.isLoading ||
    cashFlowQuery.isLoading ||
    reconciliationQuery.isLoading ||
    budgetVsActualQuery.isLoading;
  const cashBook = cashBookQuery.data;
  const cashFlow = cashFlowQuery.data;
  const reconciliation = reconciliationQuery.data;
  const budgetVsActual = budgetVsActualQuery.data;

  const operatingSection = useMemo(
    () => cashFlow?.sections.find((section) => section.name === "OPERATING"),
    [cashFlow?.sections]
  );
  const topExpenses = useMemo(
    () =>
      [...(operatingSection?.items ?? [])]
        .filter((row) => row.outflow > 0)
        .sort((a, b) => b.outflow - a.outflow)
        .slice(0, 5),
    [operatingSection?.items]
  );

  const burnRate = useMemo(() => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.max(
      1,
      Math.floor((new Date(end).getTime() - new Date(start).getTime()) / msPerDay) + 1
    );
    const outflow = operatingSection?.outflow ?? 0;
    return {
      days,
      averagePerDay: outflow > 0 ? outflow / days : 0,
    };
  }, [start, end, operatingSection?.outflow]);

  const runwayDays = useMemo(() => {
    if (!reconciliation || burnRate.averagePerDay <= 0) return null;
    return reconciliation.totals.balanceSnapshot / burnRate.averagePerDay;
  }, [reconciliation, burnRate.averagePerDay]);

  const refreshAll = () => {
    void cashBookQuery.refetch();
    void cashFlowQuery.refetch();
    void reconciliationQuery.refetch();
    void budgetVsActualQuery.refetch();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan Operasional: Buku Kas &amp; Laporan</h1>

      <div className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 md:grid-cols-6 md:items-end">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Mulai</label>
          <Input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Sampai</label>
          <Input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Grouping Buku Kas</label>
          <select
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            value={groupBy}
            onChange={(event) => setGroupBy(event.target.value as "daily" | "monthly")}
          >
            <option value="daily">Harian</option>
            <option value="monthly">Bulanan</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Kas/Bank (opsional)</label>
          <select
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            value={cashBankAccountId}
            onChange={(event) => setCashBankAccountId(event.target.value)}
          >
            <option value="">Semua rekening</option>
            {(cashBanks?.items ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} - {row.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" onClick={refreshAll}>
          Refresh
        </Button>
        <div className="flex gap-2">
          <a
            href={`/api/finance/operational/reports/cash-book/export?${queryString}`}
            className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/80"
          >
            Export Buku Kas CSV
          </a>
        </div>
      </div>

      {isLoading || !cashBook || !cashFlow || !reconciliation || !budgetVsActual ? (
        <div>Memuat laporan...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Saldo Awal Periode</p>
              <p className="text-lg font-semibold">{money(cashBook.openingBalance)}</p>
            </article>
            <article className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Saldo Akhir Periode</p>
              <p className="text-lg font-semibold">{money(cashBook.closingBalance)}</p>
            </article>
            <article className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Burn Rate (Operasional/Hari)</p>
              <p className="text-lg font-semibold">{money(burnRate.averagePerDay)}</p>
              <p className="text-xs text-muted-foreground">{burnRate.days} hari observasi</p>
            </article>
            <article className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Runway Kas (estimasi)</p>
              <p className="text-lg font-semibold">
                {runwayDays == null ? "-" : `${runwayDays.toFixed(1)} hari`}
              </p>
              <p className="text-xs text-muted-foreground">
                saldo snapshot {money(reconciliation.totals.balanceSnapshot)}
              </p>
            </article>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <section className="rounded-xl border border-border p-3">
              <h2 className="mb-2 text-sm font-semibold">Top Expense (Akun)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="border-b p-2 text-left">Akun</th>
                      <th className="border-b p-2 text-left">Transaksi</th>
                      <th className="border-b p-2 text-left">Outflow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topExpenses.map((row) => (
                      <tr key={row.accountId}>
                        <td className="border-b p-2">
                          {row.accountCode} - {row.accountName}
                        </td>
                        <td className="border-b p-2">{row.txCount}</td>
                        <td className="border-b p-2">{money(row.outflow)}</td>
                      </tr>
                    ))}
                    {topExpenses.length === 0 ? (
                      <tr>
                        <td className="p-2 text-muted-foreground" colSpan={3}>
                          Belum ada data beban operasional pada rentang ini.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-border p-3">
              <h2 className="mb-2 text-sm font-semibold">Tren Periodik Buku Kas</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="border-b p-2 text-left">{groupBy === "daily" ? "Tanggal" : "Bulan"}</th>
                      <th className="border-b p-2 text-left">Inflow</th>
                      <th className="border-b p-2 text-left">Outflow</th>
                      <th className="border-b p-2 text-left">Net</th>
                      <th className="border-b p-2 text-left">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashBook.grouped.map((row) => (
                      <tr key={row.periodKey}>
                        <td className="border-b p-2">{row.periodKey}</td>
                        <td className="border-b p-2">{money(row.inflow)}</td>
                        <td className="border-b p-2">{money(row.outflow)}</td>
                        <td className="border-b p-2">{money(row.net)}</td>
                        <td className="border-b p-2">{money(row.closingBalance)}</td>
                      </tr>
                    ))}
                    {cashBook.grouped.length === 0 ? (
                      <tr>
                        <td className="p-2 text-muted-foreground" colSpan={5}>
                          Belum ada pergerakan kas pada rentang ini.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-border p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Realisasi Anggaran vs Aktual</h2>
              <a
                href="/finance/operational/budgets"
                className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/80"
              >
                Kelola Anggaran
              </a>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <article className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Total Anggaran</p>
                <p className="text-base font-semibold">{money(budgetVsActual.totals.budget)}</p>
              </article>
              <article className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Total Aktual</p>
                <p className="text-base font-semibold">{money(budgetVsActual.totals.actual)}</p>
              </article>
              <article className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Variance</p>
                <p className="text-base font-semibold">{money(budgetVsActual.totals.variance)}</p>
              </article>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="border-b p-2 text-left">Jenis</th>
                    <th className="border-b p-2 text-left">Akun</th>
                    <th className="border-b p-2 text-left">Kas/Bank</th>
                    <th className="border-b p-2 text-left">Anggaran</th>
                    <th className="border-b p-2 text-left">Aktual</th>
                    <th className="border-b p-2 text-left">Variance</th>
                    <th className="border-b p-2 text-left">%</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetVsActual.items.slice(0, 20).map((row) => (
                    <tr key={`${row.kind}-${row.account.id}-${row.cashBankAccount?.id ?? "all"}`}>
                      <td className="border-b p-2">{row.kind}</td>
                      <td className="border-b p-2">
                        {row.account.code} - {row.account.name}
                      </td>
                      <td className="border-b p-2">
                        {row.cashBankAccount
                          ? `${row.cashBankAccount.code} - ${row.cashBankAccount.name}`
                          : "Semua"}
                      </td>
                      <td className="border-b p-2">{money(row.budgetAmount)}</td>
                      <td className="border-b p-2">{money(row.actualAmount)}</td>
                      <td className="border-b p-2">{money(row.variance)}</td>
                      <td className="border-b p-2">
                        {row.variancePct == null ? "-" : `${row.variancePct.toFixed(2)}%`}
                      </td>
                    </tr>
                  ))}
                  {budgetVsActual.items.length === 0 ? (
                    <tr>
                      <td className="p-2 text-muted-foreground" colSpan={7}>
                        Belum ada data anggaran atau transaksi pada periode ini.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border p-3">
            <h2 className="mb-2 text-sm font-semibold">Laporan Arus Kas</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="border-b p-2 text-left">Section</th>
                    <th className="border-b p-2 text-left">Inflow</th>
                    <th className="border-b p-2 text-left">Outflow</th>
                    <th className="border-b p-2 text-left">Net</th>
                    <th className="border-b p-2 text-left">Transaksi</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlow.sections.map((section) => (
                    <tr key={section.name}>
                      <td className="border-b p-2">{section.name}</td>
                      <td className="border-b p-2">{money(section.inflow)}</td>
                      <td className="border-b p-2">{money(section.outflow)}</td>
                      <td className="border-b p-2">{money(section.net)}</td>
                      <td className="border-b p-2">{section.transactionCount}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border-b p-2">INTERNAL_TRANSFER</td>
                    <td className="border-b p-2">{money(cashFlow.internalTransfers.inflow)}</td>
                    <td className="border-b p-2">{money(cashFlow.internalTransfers.outflow)}</td>
                    <td className="border-b p-2">{money(cashFlow.internalTransfers.net)}</td>
                    <td className="border-b p-2">-</td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="border-b p-2">TOTAL (excluding transfer internal)</td>
                    <td className="border-b p-2">{money(cashFlow.totals.inflow)}</td>
                    <td className="border-b p-2">{money(cashFlow.totals.outflow)}</td>
                    <td className="border-b p-2">{money(cashFlow.totals.net)}</td>
                    <td className="border-b p-2">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Rekonsiliasi Kas/Bank</h2>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/finance/operational/reports/reconciliation/export?${reconciliationExportQuery}`}
                  className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/80"
                >
                  Export CSV
                </a>
                <a
                  href={`/api/finance/operational/reports/reconciliation/export?${reconciliationExportQuery ? `${reconciliationExportQuery}&` : ""}format=xls`}
                  className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/80"
                >
                  Export XLS
                </a>
                <a
                  href={`/api/finance/operational/reports/reconciliation/export?${reconciliationExportQuery ? `${reconciliationExportQuery}&` : ""}format=pdf`}
                  className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/80"
                >
                  Export PDF
                </a>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="border-b p-2 text-left">Rekening</th>
                    <th className="border-b p-2 text-left">Opening Start</th>
                    <th className="border-b p-2 text-left">Inflow</th>
                    <th className="border-b p-2 text-left">Outflow</th>
                    <th className="border-b p-2 text-left">Closing Range</th>
                    <th className="border-b p-2 text-left">Ledger Current</th>
                    <th className="border-b p-2 text-left">Snapshot</th>
                    <th className="border-b p-2 text-left">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliation.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="border-b p-2">
                        {row.code} - {row.name}
                      </td>
                      <td className="border-b p-2">{money(row.openingAtStart)}</td>
                      <td className="border-b p-2">{money(row.periodInflow)}</td>
                      <td className="border-b p-2">{money(row.periodOutflow)}</td>
                      <td className="border-b p-2">{money(row.closingAtEndRange)}</td>
                      <td className="border-b p-2">{money(row.ledgerBalanceCurrent)}</td>
                      <td className="border-b p-2">{money(row.balanceSnapshot)}</td>
                      <td className="border-b p-2">{money(row.varianceCurrent)}</td>
                    </tr>
                  ))}
                  {reconciliation.rows.length === 0 ? (
                    <tr>
                      <td className="p-2 text-muted-foreground" colSpan={8}>
                        Tidak ada data rekening untuk direkonsiliasi.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border p-3">
            <h2 className="mb-2 text-sm font-semibold">Buku Kas Umum (Detail)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="border-b p-2 text-left">Tanggal</th>
                    <th className="border-b p-2 text-left">Jenis</th>
                    <th className="border-b p-2 text-left">Akun</th>
                    <th className="border-b p-2 text-left">Kas/Bank</th>
                    <th className="border-b p-2 text-left">Inflow</th>
                    <th className="border-b p-2 text-left">Outflow</th>
                    <th className="border-b p-2 text-left">Saldo Berjalan</th>
                    <th className="border-b p-2 text-left">Ref/Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {cashBook.entries.slice(-120).map((row) => (
                    <tr key={row.id}>
                      <td className="border-b p-2">{row.date}</td>
                      <td className="border-b p-2">{row.kind}</td>
                      <td className="border-b p-2">
                        {row.accountCode} - {row.accountName}
                      </td>
                      <td className="border-b p-2">
                        {row.cashBankCode} - {row.cashBankName}
                      </td>
                      <td className="border-b p-2">{money(row.inflow)}</td>
                      <td className="border-b p-2">{money(row.outflow)}</td>
                      <td className="border-b p-2">{money(row.runningBalance)}</td>
                      <td className="border-b p-2">
                        {row.referenceNo || row.description || "-"}
                      </td>
                    </tr>
                  ))}
                  {cashBook.entries.length === 0 ? (
                    <tr>
                      <td className="p-2 text-muted-foreground" colSpan={8}>
                        Belum ada transaksi kas untuk periode ini.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
