"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Account = { id: string; balance: number } | null;
type Txn = { id: string; type: string; amount: number; createdAt: string; approvedBy?: string | null };

function firstDayOfMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function lastDayOfMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59));
}

export default function MySavingsPage() {
  const { data: accRes } = useQuery<{ account: Account }>({ queryKey: ["portal-savings-account"], queryFn: async () => (await fetch("/api/portal/savings/account")).json() });
  const account = accRes?.account ?? null;

  const [range, setRange] = useState<{ start: string; end: string }>(() => {
    const s = firstDayOfMonth();
    const e = lastDayOfMonth();
    return { start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) };
  });

  const { data: summary } = useQuery<{ opening: number; inflow: number; outflow: number; closing: number }>({
    queryKey: ["portal-savings-summary", range.start, range.end],
    enabled: Boolean(account),
    queryFn: async () => (await fetch(`/api/portal/savings/summary?start=${range.start}&end=${range.end}`)).json(),
  });
  const { data: txns } = useQuery<{ items: Txn[] }>({
    queryKey: ["portal-savings-txns", range.start, range.end],
    enabled: Boolean(account),
    queryFn: async () => (await fetch(`/api/portal/savings/transactions?start=${range.start}&end=${range.end}`)).json(),
  });

  const fmt = (cents: number) => (cents / 100).toLocaleString(undefined, { style: "currency", currency: "IDR" });
  const hasAcc = Boolean(account);

  const pendingOut = useMemo(() => (txns?.items ?? []).filter((t) => t.type === "WITHDRAWAL" && !t.approvedBy).reduce((b, t) => b + t.amount, 0), [txns]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Tabungan</h1>
      {!hasAcc ? (
        <div className="text-sm text-gray-600">Belum ada akun tabungan.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded-md p-3">
              <div className="text-xs text-gray-600">Saldo Saat Ini</div>
              <div className="font-semibold">{fmt(account!.balance)}</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xs text-gray-600">Saldo Awal Periode</div>
              <div className="font-semibold">{fmt(summary?.opening ?? 0)}</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xs text-gray-600">Masuk</div>
              <div className="font-semibold">{fmt(summary?.inflow ?? 0)}</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xs text-gray-600">Keluar (disetujui)</div>
              <div className="font-semibold">{fmt(summary?.outflow ?? 0)}</div>
            </div>
          </div>

          {pendingOut > 0 && (
            <div className="text-xs text-amber-700">Penarikan menunggu persetujuan: {fmt(pendingOut)}</div>
          )}

          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Mulai</label>
              <input type="date" className="border rounded px-3 py-2" value={range.start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Selesai</label>
              <input type="date" className="border rounded px-3 py-2" value={range.end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} />
            </div>
          </div>

          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b">Tanggal</th>
                <th className="text-left p-2 border-b">Jenis</th>
                <th className="text-left p-2 border-b">Jumlah</th>
                <th className="text-left p-2 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {(txns?.items ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="p-2 border-b">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="p-2 border-b">{t.type}</td>
                  <td className="p-2 border-b">{fmt(t.amount)}</td>
                  <td className="p-2 border-b">{t.type === "WITHDRAWAL" ? (t.approvedBy ? "Approved" : "Pending") : "Posted"}</td>
                </tr>
              ))}
              {(txns?.items?.length ?? 0) === 0 && (
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

