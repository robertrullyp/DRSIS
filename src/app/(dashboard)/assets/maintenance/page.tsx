"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Asset = { id: string; name: string };
type Maint = { id: string; asset: Asset; type: string; date: string; cost: number; notes?: string | null };

export default function AssetMaintenancePage() {
  const qc = useQueryClient();
  const { data: assets } = useQuery<{ items: Asset[] }>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch("/api/assets");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Asset[] };
    },
  });
  const { data, isLoading } = useQuery<{ items: Maint[] }>({
    queryKey: ["asset-maint"],
    queryFn: async () => {
      const res = await fetch("/api/assets/maintenances");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Maint[] };
    },
  });

  const [assetId, setAssetId] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [cost, setCost] = useState<string>("0");
  const [notes, setNotes] = useState("");
  useEffect(() => { if (!assetId && assets?.items?.length) setAssetId(assets.items[0].id); }, [assets, assetId]);

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/assets/maintenances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetId, type, date: date || undefined, cost: Number(cost || "0"), notes: notes || undefined }) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => { setType(""); setDate(""); setCost("0"); setNotes(""); qc.invalidateQueries({ queryKey: ["asset-maint"] }); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Aset: Perawatan</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (!assetId || !type) return; create.mutate(); }} className="grid grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Aset</label>
          <Select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
            {assets?.items?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Jenis</label>
          <Input value={type} onChange={(e) => setType(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Tanggal</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Biaya</label>
          <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Catatan</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button disabled={create.isPending}>Tambah</Button>
      </form>

      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Aset</th>
              <th className="text-left p-2 border-b">Jenis</th>
              <th className="text-left p-2 border-b">Tanggal</th>
              <th className="text-left p-2 border-b">Biaya</th>
              <th className="text-left p-2 border-b">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((m) => (
              <tr key={m.id}>
                <td className="p-2 border-b">{m.asset.name}</td>
                <td className="p-2 border-b">{m.type}</td>
                <td className="p-2 border-b">{new Date(m.date).toLocaleDateString()}</td>
                <td className="p-2 border-b">{m.cost}</td>
                <td className="p-2 border-b">{m.notes ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
