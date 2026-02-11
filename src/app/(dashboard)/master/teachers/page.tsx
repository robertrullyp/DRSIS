"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Teacher = { id: string; nidn?: string | null; hireDate?: string | null; user: { name?: string | null; email: string } };

export default function TeachersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ items: Teacher[] }>({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await fetch("/api/master/teachers");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Teacher[] };
    },
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nidn, setNidn] = useState("");
  const [hireDate, setHireDate] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/master/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, nidn: nidn || undefined, hireDate: hireDate || undefined }),
      });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => {
      setName("");
      setEmail("");
      setNidn("");
      setHireDate("");
      qc.invalidateQueries({ queryKey: ["teachers"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/master/teachers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Master: Guru</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name || !email) return;
          create.mutate();
        }}
        className="grid grid-cols-5 gap-2 items-end"
      >
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nama</label>
          <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Email</label>
          <input className="border rounded px-3 py-2 w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">NIDN (opsional)</label>
          <input className="border rounded px-3 py-2 w-full" value={nidn} onChange={(e) => setNidn(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Tgl Masuk (opsional)</label>
          <input className="border rounded px-3 py-2 w-full" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
        </div>
        <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" disabled={create.isPending}>Tambah</button>
      </form>

      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Email</th>
              <th className="text-left p-2 border-b">NIDN</th>
              <th className="text-left p-2 border-b">Tgl Masuk</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((t) => (
              <tr key={t.id}>
                <td className="p-2 border-b">{t.user?.name ?? "-"}</td>
                <td className="p-2 border-b">{t.user?.email}</td>
                <td className="p-2 border-b">{t.nidn ?? "-"}</td>
                <td className="p-2 border-b">{t.hireDate ? new Date(t.hireDate).toLocaleDateString() : "-"}</td>
                <td className="p-2 border-b">
                  <button className="text-xs px-2 py-1 rounded border border-red-500 text-red-600" onClick={() => remove.mutate(t.id)} disabled={remove.isPending}>
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
