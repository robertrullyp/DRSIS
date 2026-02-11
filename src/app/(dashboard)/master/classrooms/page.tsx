"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type Grade = { id: string; name: string };
type AcademicYear = { id: string; name: string };

export default function ClassroomsPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [ayId, setAyId] = useState("");

  const { data: gradeData } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const res = await fetch("/api/master/grades");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Grade[] };
    },
  });
  const { data: ayData } = useQuery({
    queryKey: ["ay-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/academic-years");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: AcademicYear[] };
    },
  });

  type ClassroomRow = {
    id: string;
    code: string;
    name: string;
    grade?: { name: string } | null;
    academicYear?: { name: string } | null;
  };
  const { data, isLoading } = useQuery<{ items: ClassroomRow[] }>({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const res = await fetch("/api/master/classrooms");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: ClassroomRow[] };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/master/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, gradeId, academicYearId: ayId }),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      setCode("");
      setName("");
      qc.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });

  useEffect(() => {
    if (!gradeId && gradeData?.items?.length) setGradeId(gradeData.items[0].id);
    if (!ayId && ayData?.items?.length) setAyId(ayData.items[0].id);
  }, [gradeData, ayData, gradeId, ayId]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Master: Kelas</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!code || !name || !gradeId || !ayId) return;
          create.mutate();
        }}
        className="grid grid-cols-5 gap-2 items-end"
      >
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Kode</label>
          <input className="border rounded px-3 py-2 w-full" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nama</label>
          <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Tingkat</label>
          <select className="border rounded px-3 py-2 w-full" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
            {gradeData?.items?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
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
              <th className="text-left p-2 border-b">Kode</th>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Tingkat</th>
              <th className="text-left p-2 border-b">Tahun Ajaran</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((c) => (
              <tr key={c.id}>
                <td className="p-2 border-b">{c.code}</td>
                <td className="p-2 border-b">{c.name}</td>
                <td className="p-2 border-b">{c.grade?.name}</td>
                <td className="p-2 border-b">{c.academicYear?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
