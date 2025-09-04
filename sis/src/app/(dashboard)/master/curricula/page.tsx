"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function CurriculaPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [year, setYear] = useState<string>("");
  const [notes, setNotes] = useState("");

  type CurriculumRow = { id: string; name: string; year?: number | null; notes?: string | null };
  const { data, isLoading } = useQuery<{ items: CurriculumRow[] }>({
    queryKey: ["curricula"],
    queryFn: async () => {
      const res = await fetch("/api/master/curricula");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: CurriculumRow[] };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/master/curricula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, year: year ? Number(year) : undefined, notes: notes || undefined }),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      setName("");
      setYear("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["curricula"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Master: Kurikulum</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name) return;
          create.mutate();
        }}
        className="grid grid-cols-4 gap-2 items-end"
      >
        <div>
          <label className="block text-xs text-gray-600 mb-1">Nama</label>
          <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tahun</label>
          <input className="border rounded px-3 py-2 w-full" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Catatan</label>
          <input className="border rounded px-3 py-2 w-full" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" disabled={create.isPending}>
          Tambah
        </button>
      </form>
      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Tahun</th>
              <th className="text-left p-2 border-b">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((c) => (
              <tr key={c.id}>
                <td className="p-2 border-b">{c.name}</td>
                <td className="p-2 border-b">{c.year ?? "-"}</td>
                <td className="p-2 border-b">{c.notes ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
