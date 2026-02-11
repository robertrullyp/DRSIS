"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Cat = { id: string; name: string };
type Asset = { id: string; code: string; name: string; location?: string | null; category?: Cat | null };

export default function AssetsInventoryPage() {
  const qc = useQueryClient();
  const { data: cats } = useQuery<{ items: Cat[] }>({
    queryKey: ["asset-cats"],
    queryFn: async () => {
      const res = await fetch("/api/assets/categories");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Cat[] };
    },
  });
  const { data, isLoading } = useQuery<{ items: Asset[] }>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch("/api/assets");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Asset[] };
    },
  });

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  useEffect(() => { if (!categoryId && cats?.items?.length) setCategoryId(cats.items[0].id); }, [cats, categoryId]);

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, name, categoryId: categoryId || undefined, location: location || undefined }) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => { setCode(""); setName(""); setLocation(""); qc.invalidateQueries({ queryKey: ["assets"] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Aset: Inventaris</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (!code || !name) return; create.mutate(); }} className="grid grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Kode</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nama</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Kategori</label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {cats?.items?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Lokasi</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
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
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Kategori</th>
              <th className="text-left p-2 border-b">Lokasi</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((a) => (
              <tr key={a.id}>
                <td className="p-2 border-b">{a.code}</td>
                <td className="p-2 border-b">{a.name}</td>
                <td className="p-2 border-b">{a.category?.name ?? "-"}</td>
                <td className="p-2 border-b">{a.location ?? "-"}</td>
                <td className="p-2 border-b">
                  <Button variant="outline" className="text-xs px-2 py-1" onClick={() => remove.mutate(a.id)} disabled={remove.isPending}>Hapus</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
