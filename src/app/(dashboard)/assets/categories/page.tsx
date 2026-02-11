"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Cat = { id: string; name: string; description?: string | null };

export default function AssetCategoriesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ items: Cat[] }>({
    queryKey: ["asset-cats"],
    queryFn: async () => {
      const res = await fetch("/api/assets/categories");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Cat[] };
    },
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/assets/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description: description || undefined }) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => { setName(""); setDescription(""); qc.invalidateQueries({ queryKey: ["asset-cats"] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assets/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["asset-cats"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Aset: Kategori</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (!name) return; create.mutate(); }} className="grid grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nama</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">Deskripsi</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button disabled={create.isPending}>Tambah</Button>
      </form>
      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Deskripsi</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((c) => (
              <tr key={c.id}>
                <td className="p-2 border-b">{c.name}</td>
                <td className="p-2 border-b">{c.description ?? "-"}</td>
                <td className="p-2 border-b">
                  <Button variant="outline" className="text-xs px-2 py-1" onClick={() => remove.mutate(c.id)} disabled={remove.isPending}>Hapus</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
