"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type Semester = { id: string; name: string; number?: number; academicYearId: string };
type AcademicYear = { id: string; name: string };

export default function SemestersPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [number, setNumber] = useState<number | "">("");
  const [ayId, setAyId] = useState("");

  const { data: ayData } = useQuery({
    queryKey: ["ay-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/academic-years");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: AcademicYear[] };
    },
  });

  type SemesterRow = Semester & { academicYear?: { name: string } | null };
  const { data, isLoading } = useQuery<{ items: SemesterRow[] }>({
    queryKey: ["semesters"],
    queryFn: async () => {
      const res = await fetch("/api/master/semesters");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: SemesterRow[] };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/master/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, number: number === "" ? undefined : Number(number), academicYearId: ayId }),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      setName("");
      setNumber("");
      qc.invalidateQueries({ queryKey: ["semesters"] });
    },
  });

  useEffect(() => {
    if (!ayId && ayData?.items?.length) setAyId(ayData.items[0].id);
  }, [ayData, ayId]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Master: Semester</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name || !ayId) return;
          create.mutate();
        }}
        className="grid grid-cols-4 gap-2 items-end"
      >
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nama</label>
          <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nomor</label>
          <input
            className="border rounded px-3 py-2 w-full"
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Tahun Ajaran</label>
          <select className="border rounded px-3 py-2 w-full" value={ayId} onChange={(e) => setAyId(e.target.value)}>
            {ayData?.items?.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
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
              <th className="text-left p-2 border-b">Nomor</th>
              <th className="text-left p-2 border-b">Tahun Ajaran</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border-b">{s.name}</td>
                <td className="p-2 border-b">{s.number ?? "-"}</td>
                <td className="p-2 border-b">{s.academicYear?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
