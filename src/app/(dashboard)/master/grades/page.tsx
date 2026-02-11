"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Grade = { id: string; name: string };

async function fetchGrades() {
  const res = await fetch("/api/master/grades");
  if (!res.ok) throw new Error("Failed");
  return (await res.json()) as { items: Grade[] };
}

export default function GradesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["grades"], queryFn: fetchGrades });
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/master/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["grades"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/master/grades/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grades"] }),
  });

  useEffect(() => {
    // prefetch
    qc.prefetchQuery({ queryKey: ["grades"], queryFn: fetchGrades });
  }, [qc]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Master: Tingkat</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          create.mutate();
        }}
        className="flex gap-2"
      >
        <input
          className="border rounded px-3 py-2"
          placeholder="Nama tingkat (mis. X)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((g) => (
              <tr key={g.id}>
                <td className="p-2 border-b">{g.name}</td>
                <td className="p-2 border-b">
                  <button
                    className="text-xs px-2 py-1 rounded border border-red-500 text-red-600"
                    onClick={() => remove.mutate(g.id)}
                    disabled={remove.isPending}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
