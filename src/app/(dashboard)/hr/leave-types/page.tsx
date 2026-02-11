"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type LeaveType = { id: string; name: string; description?: string | null; maxDaysPerYear?: number | null; active: boolean; requiresApproval: boolean };

export default function LeaveTypesPage() {
  const qc = useQueryClient();
  const { data, isFetching } = useQuery<{ items: LeaveType[] }>({ queryKey: ["leave-types"], queryFn: async () => (await fetch(`/api/hr/leave-types?pageSize=200`)).json() });
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [max, setMax] = useState<string>("");
  const [active, setActive] = useState(true);
  const [req, setReq] = useState(true);
  const [present, setPresent] = useState(false);

  const create = useMutation({
    mutationFn: async () => {
      const body: any = { name, description: desc || undefined, active, requiresApproval: req, countsAsPresence: present };
      if (max) body.maxDaysPerYear = Number(max);
      const res = await fetch("/api/hr/leave-types", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => { setName(""); setDesc(""); setMax(""); setActive(true); setReq(true); setPresent(false); qc.invalidateQueries({ queryKey: ["leave-types"] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/hr/leave-types/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-types"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">HR: Tipe Cuti/Izin</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (!name) return; create.mutate(); }} className="grid md:grid-cols-6 gap-3 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nama</label>
          <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Deskripsi</label>
          <input className="border rounded px-3 py-2 w-full" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Maks Hari/Tahun</label>
          <input className="border rounded px-3 py-2 w-full" type="number" min={0} value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Aktif</label>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Butuh Approval</label>
          <input type="checkbox" checked={req} onChange={(e) => setReq(e.target.checked)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Hitung Hadir (Dinas/Pelatihan)</label>
          <input type="checkbox" checked={present} onChange={(e) => setPresent(e.target.checked)} />
        </div>
        <div className="md:col-span-6">
          <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" disabled={create.isPending}>Tambah</button>
        </div>
      </form>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Deskripsi</th>
              <th className="text-left p-2 border-b">Maks Hari/Tahun</th>
              <th className="text-left p-2 border-b">Aktif</th>
              <th className="text-left p-2 border-b">Approval</th>
              <th className="text-left p-2 border-b">Hitung Hadir</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((t) => (
              <tr key={t.id}>
                <td className="p-2 border-b">{t.name}</td>
                <td className="p-2 border-b">{t.description ?? ""}</td>
                <td className="p-2 border-b">{t.maxDaysPerYear ?? "-"}</td>
                <td className="p-2 border-b">{t.active ? "Ya" : "Tidak"}</td>
                <td className="p-2 border-b">{t.requiresApproval ? "Ya" : "Tidak"}</td>
                <td className="p-2 border-b">{(t as any).countsAsPresence ? "Ya" : "Tidak"}</td>
                <td className="p-2 border-b">
                  <button className="text-xs px-2 py-1 rounded border border-red-500 text-red-600" onClick={() => remove.mutate(t.id)} disabled={remove.isPending}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
