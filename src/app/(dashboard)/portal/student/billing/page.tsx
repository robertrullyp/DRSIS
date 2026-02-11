"use client";

import { useQuery } from "@tanstack/react-query";

type Item = { id: string; code: string; total: number; status: string; dueDate?: string | null; academicYear: { name: string } };

export default function MyBillingPage() {
  const { data, isFetching } = useQuery<{ items: Item[] }>({ queryKey: ["portal-billing"], queryFn: async () => (await fetch("/api/portal/billing")).json() });
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Tagihan</h1>
      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Kode</th>
              <th className="text-left p-2 border-b">Tahun Ajaran</th>
              <th className="text-left p-2 border-b">Jatuh Tempo</th>
              <th className="text-left p-2 border-b">Status</th>
              <th className="text-left p-2 border-b">Total</th>
              <th className="text-left p-2 border-b">Kuitansi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((inv) => (
              <tr key={inv.id}>
                <td className="p-2 border-b">{inv.code}</td>
                <td className="p-2 border-b">{inv.academicYear?.name}</td>
                <td className="p-2 border-b">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}</td>
                <td className="p-2 border-b">{inv.status}</td>
                <td className="p-2 border-b">{(inv.total / 100).toLocaleString(undefined, { style: "currency", currency: "IDR" })}</td>
                <td className="p-2 border-b"><a className="text-accent underline" href={`/api/portal/billing/${inv.id}/receipt`} target="_blank" rel="noreferrer">Lihat</a></td>
              </tr>
            ))}
            {(data?.items?.length ?? 0) === 0 && (
              <tr>
                <td className="p-2" colSpan={6}>Tidak ada tagihan.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
