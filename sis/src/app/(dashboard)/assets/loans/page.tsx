"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Asset = { id: string; name: string };
type User = { id: string; name?: string | null; email: string };
type Loan = { id: string; asset: Asset; borrower: User; borrowedAt: string; dueAt?: string | null; returnedAt?: string | null };

export default function AssetLoansPage() {
  const qc = useQueryClient();
  const { data: assets } = useQuery<{ items: Asset[] }>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch("/api/assets");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Asset[] };
    },
  });
  const { data: users } = useQuery<{ items: User[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: User[] };
    },
  });
  const { data, isLoading } = useQuery<{ items: Loan[] }>({
    queryKey: ["asset-loans"],
    queryFn: async () => {
      const res = await fetch("/api/assets/loans?active=true");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Loan[] };
    },
  });

  const [assetId, setAssetId] = useState("");
  const [userId, setUserId] = useState("");
  const [dueAt, setDueAt] = useState("");
  useEffect(() => { if (!assetId && assets?.items?.length) setAssetId(assets.items[0].id); if (!userId && users?.items?.length) setUserId(users.items[0].id); }, [assets, users, assetId, userId]);

  const borrow = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/assets/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetId, borrowerUserId: userId, dueAt: dueAt || undefined }) });
      if (!res.ok) throw new Error("Borrow failed");
    },
    onSuccess: () => { setDueAt(""); qc.invalidateQueries({ queryKey: ["asset-loans"] }); },
  });

  const doReturn = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assets/loans/${id}/return`, { method: "POST" });
      if (!res.ok) throw new Error("Return failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["asset-loans"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Aset: Peminjaman</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (!assetId || !userId) return; borrow.mutate(); }} className="grid grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Aset</label>
          <Select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
            {assets?.items?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Peminjam</label>
          <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
            {users?.items?.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Jatuh Tempo (opsional)</label>
          <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </div>
        <Button disabled={borrow.isPending}>Pinjam</Button>
      </form>

      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Aset</th>
              <th className="text-left p-2 border-b">Peminjam</th>
              <th className="text-left p-2 border-b">Pinjam</th>
              <th className="text-left p-2 border-b">Jatuh Tempo</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((l) => (
              <tr key={l.id}>
                <td className="p-2 border-b">{l.asset.name}</td>
                <td className="p-2 border-b">{l.borrower.name ?? l.borrower.email}</td>
                <td className="p-2 border-b">{new Date(l.borrowedAt).toLocaleDateString()}</td>
                <td className="p-2 border-b">{l.dueAt ? new Date(l.dueAt).toLocaleDateString() : "-"}</td>
                <td className="p-2 border-b">
                  <Button variant="outline" className="text-xs px-2 py-1" onClick={() => doReturn.mutate(l.id)} disabled={doReturn.isPending}>Kembalikan</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
