"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FinanceAccount = {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
  isActive: boolean;
};

type CashBank = {
  id: string;
  code: string;
  name: string;
  type: "CASH" | "BANK";
  isActive: boolean;
};

type BudgetRow = {
  id: string;
  periodStart: string;
  periodEnd: string;
  kind: "INCOME" | "EXPENSE";
  amount: number;
  notes?: string | null;
  account: { id: string; code: string; name: string; type: FinanceAccount["type"] };
  cashBankAccount?: { id: string; code: string; name: string; type: CashBank["type"] } | null;
};

type BudgetListResponse = {
  items: BudgetRow[];
  total: number;
  page: number;
  pageSize: number;
};

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FinanceOperationalBudgetsPage() {
  const qc = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const [periodStart, setPeriodStart] = useState(
    toDateInput(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [periodEnd, setPeriodEnd] = useState(toDateInput(today));
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [cashBankAccountId, setCashBankAccountId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: accounts } = useQuery<{ items: FinanceAccount[] }>({
    queryKey: ["finance-operational-accounts"],
    queryFn: async () =>
      (await (
        await fetch("/api/finance/operational/accounts?pageSize=500&isActive=true")
      ).json()) as { items: FinanceAccount[] },
  });

  const { data: cashBanks } = useQuery<{ items: CashBank[] }>({
    queryKey: ["finance-operational-cash-banks"],
    queryFn: async () =>
      (await (
        await fetch("/api/finance/operational/cash-accounts?pageSize=500&isActive=true")
      ).json()) as { items: CashBank[] },
  });

  const { data: budgets, isLoading } = useQuery<BudgetListResponse>({
    queryKey: ["finance-operational-budgets", periodStart, periodEnd, kind],
    queryFn: async () => {
      const params = new URLSearchParams({
        pageSize: "200",
        start: periodStart,
        end: periodEnd,
        kind,
      });
      const res = await fetch(`/api/finance/operational/budgets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load budgets");
      return (await res.json()) as BudgetListResponse;
    },
  });

  const accountOptions = useMemo(() => {
    const all = accounts?.items ?? [];
    return all.filter((row) =>
      kind === "INCOME" ? row.type === "INCOME" : row.type === "EXPENSE"
    );
  }, [accounts?.items, kind]);

  const createBudget = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/finance/operational/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart,
          periodEnd,
          kind,
          amount: Number(amount),
          accountId,
          cashBankAccountId: cashBankAccountId || null,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to create budget");
      }
    },
    onSuccess: () => {
      setAmount("");
      setNotes("");
      setAccountId("");
      qc.invalidateQueries({ queryKey: ["finance-operational-budgets"] });
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/operational/budgets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete budget");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-operational-budgets"] });
    },
  });

  const totalBudget = useMemo(
    () => (budgets?.items ?? []).reduce((acc, row) => acc + row.amount, 0),
    [budgets?.items]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan Operasional: Anggaran</h1>

      <form
        className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 md:grid-cols-8 md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (!periodStart || !periodEnd || !amount || !accountId) return;
          createBudget.mutate();
        }}
      >
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Mulai</label>
          <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Selesai</label>
          <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Jenis</label>
          <select
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            value={kind}
            onChange={(event) => {
              const next = event.target.value as "INCOME" | "EXPENSE";
              setKind(next);
              setAccountId("");
            }}
          >
            <option value="EXPENSE">EXPENSE</option>
            <option value="INCOME">INCOME</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Nominal</label>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-muted-foreground">Akun COA</label>
          <select
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
          >
            <option value="">Pilih akun</option>
            {accountOptions.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} - {row.name}
              </option>
            ))}
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
        <Button type="submit" disabled={createBudget.isPending}>
          Simpan
        </Button>
        <div className="md:col-span-8">
          <label className="mb-1 block text-xs text-muted-foreground">Catatan</label>
          <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opsional" />
        </div>
      </form>

      <div className="rounded-xl border border-border p-3">
        <p className="text-xs text-muted-foreground">Total anggaran pada filter</p>
        <p className="text-lg font-semibold">{money(totalBudget)}</p>
      </div>

      {isLoading ? (
        <div>Memuat...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b p-2 text-left">Periode</th>
                <th className="border-b p-2 text-left">Jenis</th>
                <th className="border-b p-2 text-left">Akun</th>
                <th className="border-b p-2 text-left">Kas/Bank</th>
                <th className="border-b p-2 text-left">Nominal</th>
                <th className="border-b p-2 text-left">Catatan</th>
                <th className="border-b p-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(budgets?.items ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="border-b p-2">
                    {new Date(row.periodStart).toLocaleDateString("id-ID")} -{" "}
                    {new Date(row.periodEnd).toLocaleDateString("id-ID")}
                  </td>
                  <td className="border-b p-2">{row.kind}</td>
                  <td className="border-b p-2">
                    {row.account.code} - {row.account.name}
                  </td>
                  <td className="border-b p-2">
                    {row.cashBankAccount ? `${row.cashBankAccount.code} - ${row.cashBankAccount.name}` : "Semua"}
                  </td>
                  <td className="border-b p-2">{money(row.amount)}</td>
                  <td className="border-b p-2">{row.notes || "-"}</td>
                  <td className="border-b p-2">
                    <Button
                      variant="outline"
                      onClick={() => deleteBudget.mutate(row.id)}
                      disabled={deleteBudget.isPending}
                    >
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))}
              {(budgets?.items?.length ?? 0) === 0 ? (
                <tr>
                  <td className="p-2 text-muted-foreground" colSpan={7}>
                    Belum ada anggaran untuk filter periode ini.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

