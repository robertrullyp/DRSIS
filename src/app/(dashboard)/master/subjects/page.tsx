"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Grade = { id: string; name: string };
type Curriculum = { id: string; name: string };

export default function SubjectsPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [gradeId, setGradeId] = useState<string | "">("");
  const [curriculumId, setCurriculumId] = useState<string | "">("");

  const { data: gradeData } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const res = await fetch("/api/master/grades");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Grade[] };
    },
  });
  const { data: curData } = useQuery({
    queryKey: ["curricula"],
    queryFn: async () => {
      const res = await fetch("/api/master/curricula");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Curriculum[] };
    },
  });
  type SubjectRow = { id: string; code: string; name: string; grade?: { name: string } | null; curriculum?: { name: string } | null };
  const { data, isLoading } = useQuery<{ items: SubjectRow[] }>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/master/subjects");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: SubjectRow[] };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/master/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, gradeId: gradeId || undefined, curriculumId: curriculumId || undefined }),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      setCode("");
      setName("");
      qc.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  // No defaulting here; selection is optional

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Master: Mata Pelajaran</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!code || !name) return;
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
          <label className="block text-xs text-muted-foreground mb-1">Tingkat (opsional)</label>
          <select className="border rounded px-3 py-2 w-full" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
            <option value="">(tidak ditentukan)</option>
            {gradeData?.items?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Kurikulum (opsional)</label>
          <select className="border rounded px-3 py-2 w-full" value={curriculumId} onChange={(e) => setCurriculumId(e.target.value)}>
            <option value="">(tidak ditentukan)</option>
            {curData?.items?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
              <th className="text-left p-2 border-b">Kurikulum</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border-b">{s.code}</td>
                <td className="p-2 border-b">{s.name}</td>
                <td className="p-2 border-b">{s.grade?.name || "-"}</td>
                <td className="p-2 border-b">{s.curriculum?.name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
