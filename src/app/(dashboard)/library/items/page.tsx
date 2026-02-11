"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Item = { id: string; code: string; title: string; author?: string | null; copies: number; available: number };

export default function LibraryItemsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery<{ items: Item[] }>({
    queryKey: ["lib-items", q],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      const res = await fetch(`/api/library/items?${p.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Item[] };
    },
  });

  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [copies, setCopies] = useState<string>("1");

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/library/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, title, author: author || undefined, copies: Number(copies) }) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => { setCode(""); setTitle(""); setAuthor(""); setCopies("1"); qc.invalidateQueries({ queryKey: ["lib-items"] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/library/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lib-items"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Perpustakaan: Katalog</h1>
      <div className="grid grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Cari</label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (!code || !title) return; create.mutate(); }} className="grid grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Kode</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">Judul</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Penulis</label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Eksemplar</label>
          <Input type="number" value={copies} onChange={(e) => setCopies(e.target.value)} />
        </div>
        <Button disabled={create.isPending}>Tambah</Button>
      </form>

      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Kode</th>
              <th className="text-left p-2 border-b">Judul</th>
              <th className="text-left p-2 border-b">Penulis</th>
              <th className="text-left p-2 border-b">Ketersediaan</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((it) => (
              <tr key={it.id}>
                <td className="p-2 border-b">{it.code}</td>
                <td className="p-2 border-b">{it.title}</td>
                <td className="p-2 border-b">{it.author ?? "-"}</td>
                <td className="p-2 border-b">{it.available}/{it.copies}</td>
                <td className="p-2 border-b">
                  <button className="text-xs px-2 py-1 rounded border border-red-500 text-red-600" onClick={() => remove.mutate(it.id)} disabled={remove.isPending}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
