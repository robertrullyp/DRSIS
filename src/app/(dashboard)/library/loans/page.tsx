"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Member = { id: string; user?: { name?: string | null } | null; student?: { user: { name?: string | null } } | null };
type Item = { id: string; title: string; available: number };
type Loan = { id: string; borrowedAt: string; dueAt: string; returnedAt?: string | null; fine: number; item: { title: string }; member: Member };

export default function LibraryLoansPage() {
  const qc = useQueryClient();

  const { data: members } = useQuery<{ items: Member[] }>({
    queryKey: ["lib-members"],
    queryFn: async () => {
      const res = await fetch("/api/library/members");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Member[] };
    },
  });
  const { data: items } = useQuery<{ items: Item[] }>({
    queryKey: ["lib-items"],
    queryFn: async () => {
      const res = await fetch("/api/library/items");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Item[] };
    },
  });
  const [memberId, setMemberId] = useState("");
  const [itemId, setItemId] = useState("");
  useEffect(() => { if (!memberId && members?.items?.length) setMemberId(members.items[0].id); if (!itemId && items?.items?.length) setItemId(items.items[0].id); }, [members, items, memberId, itemId]);

  const { data, isLoading } = useQuery<{ items: Loan[] }>({
    queryKey: ["lib-loans"],
    queryFn: async () => {
      const res = await fetch("/api/library/loans?active=true");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Loan[] };
    },
  });

  const borrow = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/library/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId, memberId }) });
      if (!res.ok) throw new Error("Borrow failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lib-loans"] }); qc.invalidateQueries({ queryKey: ["lib-items"] }); },
  });

  const doReturn = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/library/loans/${id}/return`, { method: "POST" });
      if (!res.ok) throw new Error("Return failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lib-loans"] }); qc.invalidateQueries({ queryKey: ["lib-items"] }); },
  });

  // Barcode actions
  const [barcode, setBarcode] = useState("");
  const borrowByBarcode = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/library/loans/borrow-by-barcode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId, barcode }) });
      if (!res.ok) throw new Error("Borrow by barcode failed");
    },
    onSuccess: () => { setBarcode(""); qc.invalidateQueries({ queryKey: ["lib-loans"] }); qc.invalidateQueries({ queryKey: ["lib-items"] }); },
  });
  const returnByBarcode = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/library/loans/return-by-barcode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ barcode, memberId }) });
      if (!res.ok) throw new Error("Return by barcode failed");
    },
    onSuccess: () => { setBarcode(""); qc.invalidateQueries({ queryKey: ["lib-loans"] }); qc.invalidateQueries({ queryKey: ["lib-items"] }); },
  });

  function memberName(m: Member) {
    return m.student?.user?.name ?? m.user?.name ?? m.id;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Perpustakaan: Pinjam/Kembali</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (!memberId || !itemId) return; borrow.mutate(); }} className="grid grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Anggota</label>
          <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            {members?.items?.map((m) => (
              <option key={m.id} value={m.id}>{memberName(m)}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Koleksi</label>
          <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {items?.items?.map((it) => (
              <option key={it.id} value={it.id}>{it.title} ({it.available} tersedia)</option>
            ))}
          </Select>
        </div>
        <Button disabled={borrow.isPending}>Pinjam</Button>
      </form>

      <div className="grid grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Barcode</label>
          <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => borrowByBarcode.mutate()} disabled={borrowByBarcode.isPending || !memberId || !barcode}>Pinjam via Barcode</Button>
        <Button variant="outline" onClick={() => returnByBarcode.mutate()} disabled={returnByBarcode.isPending || !barcode}>Kembalikan via Barcode</Button>
      </div>

      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Anggota</th>
              <th className="text-left p-2 border-b">Koleksi</th>
              <th className="text-left p-2 border-b">Pinjam</th>
              <th className="text-left p-2 border-b">Jatuh Tempo</th>
              <th className="text-left p-2 border-b">Denda</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((l) => (
              <tr key={l.id}>
                <td className="p-2 border-b">{memberName(l.member)}</td>
                <td className="p-2 border-b">{l.item.title}</td>
                <td className="p-2 border-b">{new Date(l.borrowedAt).toLocaleDateString()}</td>
                <td className="p-2 border-b">{new Date(l.dueAt).toLocaleDateString()}</td>
                <td className="p-2 border-b">{l.fine ? l.fine : 0}</td>
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
