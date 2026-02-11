"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Shift = { id: string; name: string; startTime: string; endTime: string };

export default function ShiftsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ items: Shift[] }>({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await fetch("/api/hr/shifts");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Shift[] };
    },
  });

  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/hr/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startTime, endTime }),
      });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => {
      setName("");
      setStartTime("");
      setEndTime("");
      qc.invalidateQueries({ queryKey: ["shifts"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Shift Pegawai</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name || !startTime || !endTime) return;
          create.mutate();
        }}
        className="grid grid-cols-4 gap-2 items-end"
      >
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nama</label>
          <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Mulai (HH:mm)</label>
          <input className="border rounded px-3 py-2 w-full" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Selesai (HH:mm)</label>
          <input className="border rounded px-3 py-2 w-full" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" disabled={create.isPending}>
          Tambah
        </button>
      </form>
      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Mulai</th>
              <th className="text-left p-2 border-b">Selesai</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border-b">{s.name}</td>
                <td className="p-2 border-b">{s.startTime}</td>
                <td className="p-2 border-b">{s.endTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
