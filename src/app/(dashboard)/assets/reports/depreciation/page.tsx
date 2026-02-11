"use client";

import { useState } from "react";

type Row = { id: string; code: string; name: string; category?: string | null; month: string; monthlyDepreciation: number };

export default function AssetDepreciationReportPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<{ items: Row[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/reports/depreciation?month=${encodeURIComponent(month)}`);
      if (!res.ok) throw new Error("Failed");
      const j = await res.json();
      setData({ items: j.items, total: j.total });
    } finally { setLoading(false); }
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Aset: Laporan Depresiasi</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Bulan</label>
          <input type="month" className="border rounded px-3 py-2" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" onClick={load} disabled={loading}>Tampilkan</button>
      </div>
      {loading ? (
        <div>Memuat…</div>
      ) : (
        <>
          <table className="w-full text-sm border">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 border-b">Kode</th>
                <th className="text-left p-2 border-b">Nama</th>
                <th className="text-left p-2 border-b">Kategori</th>
                <th className="text-left p-2 border-b">Depresiasi ({month})</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="p-2 border-b">{r.code}</td>
                  <td className="p-2 border-b">{r.name}</td>
                  <td className="p-2 border-b">{r.category ?? '-'}</td>
                  <td className="p-2 border-b">{r.monthlyDepreciation}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-sm font-medium">Total depresiasi bulan {month}: {total}</div>
        </>
      )}
    </div>
  );
}
