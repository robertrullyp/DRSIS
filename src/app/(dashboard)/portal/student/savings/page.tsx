"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortalStudentScopeBanner, usePortalStudentScope } from "@/components/portal/student-scope";

type Account = { id: string; balance: number } | null;
type Txn = { id: string; type: string; amount: number; createdAt: string; approvedBy?: string | null };

function firstDayOfMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function lastDayOfMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59));
}

export default function MySavingsPage() {
  const { me, isLoading, selectedChildId, childScopedUrl, setSelectedChildId } = usePortalStudentScope();

  const [range, setRange] = useState<{ start: string; end: string }>(() => {
    const start = firstDayOfMonth();
    const end = lastDayOfMonth();
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  });

  const { data: accountResponse } = useQuery<{ account: Account }>({
    queryKey: ["portal-savings-account", selectedChildId],
    enabled: Boolean(me?.student),
    queryFn: async () => {
      const res = await fetch(childScopedUrl("/api/portal/savings/account"));
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { account: Account };
    },
  });

  const account = accountResponse?.account ?? null;

  const { data: summary } = useQuery<{ opening: number; inflow: number; outflow: number; closing: number }>({
    queryKey: ["portal-savings-summary", selectedChildId, range.start, range.end],
    enabled: Boolean(account),
    queryFn: async () => {
      const res = await fetch(childScopedUrl(`/api/portal/savings/summary?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`));
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { opening: number; inflow: number; outflow: number; closing: number };
    },
  });

  const { data: transactions } = useQuery<{ items: Txn[] }>({
    queryKey: ["portal-savings-transactions", selectedChildId, range.start, range.end],
    enabled: Boolean(account),
    queryFn: async () => {
      const res = await fetch(childScopedUrl(`/api/portal/savings/transactions?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`));
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Txn[] };
    },
  });

  const formatCurrency = (amount: number) => (amount / 100).toLocaleString(undefined, { style: "currency", currency: "IDR" });

  const pendingWithdrawal = useMemo(
    () => (transactions?.items ?? []).filter((txn) => txn.type === "WITHDRAWAL" && !txn.approvedBy).reduce((total, txn) => total + txn.amount, 0),
    [transactions]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Tabungan</h1>
      <PortalStudentScopeBanner me={me} isLoading={isLoading} onSelectChild={setSelectedChildId} />
      {!account ? (
        <div className="text-sm text-muted-foreground">Belum ada akun tabungan.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Saldo Saat Ini</div>
              <div className="font-semibold">{formatCurrency(account.balance)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Saldo Awal Periode</div>
              <div className="font-semibold">{formatCurrency(summary?.opening ?? 0)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Masuk</div>
              <div className="font-semibold">{formatCurrency(summary?.inflow ?? 0)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Keluar (disetujui)</div>
              <div className="font-semibold">{formatCurrency(summary?.outflow ?? 0)}</div>
            </div>
          </div>

          {pendingWithdrawal > 0 && (
            <div className="text-xs text-amber-700">Penarikan menunggu persetujuan: {formatCurrency(pendingWithdrawal)}</div>
          )}

          <div className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Mulai</label>
              <input type="date" className="rounded border px-3 py-2" value={range.start} onChange={(event) => setRange((prev) => ({ ...prev, start: event.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Selesai</label>
              <input type="date" className="rounded border px-3 py-2" value={range.end} onChange={(event) => setRange((prev) => ({ ...prev, end: event.target.value }))} />
            </div>
          </div>

          <table className="w-full border text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b p-2 text-left">Tanggal</th>
                <th className="border-b p-2 text-left">Jenis</th>
                <th className="border-b p-2 text-left">Jumlah</th>
                <th className="border-b p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {(transactions?.items ?? []).map((txn) => (
                <tr key={txn.id}>
                  <td className="border-b p-2">{new Date(txn.createdAt).toLocaleString()}</td>
                  <td className="border-b p-2">{txn.type}</td>
                  <td className="border-b p-2">{formatCurrency(txn.amount)}</td>
                  <td className="border-b p-2">{txn.type === "WITHDRAWAL" ? (txn.approvedBy ? "Approved" : "Pending") : "Posted"}</td>
                </tr>
              ))}
              {(transactions?.items?.length ?? 0) === 0 && (
                <tr>
                  <td className="p-2" colSpan={4}>Tidak ada transaksi untuk periode ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
