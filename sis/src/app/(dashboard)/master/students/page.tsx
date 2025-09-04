"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Student = {
  id: string;
  nis?: string | null;
  nisn?: string | null;
  gender?: string | null;
  user: { name?: string | null; email: string };
};

export default function StudentsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ items: Student[] }>({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/master/students");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Student[] };
    },
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nis, setNis] = useState("");
  const [nisn, setNisn] = useState("");
  const [gender, setGender] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/master/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, nis: nis || undefined, nisn: nisn || undefined, gender: (gender || undefined) as any }),
      });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => {
      setName("");
      setEmail("");
      setNis("");
      setNisn("");
      setGender("");
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/master/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Master: Siswa</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name || !email) return;
          create.mutate();
        }}
        className="grid grid-cols-6 gap-2 items-end"
      >
        <div>
          <label className="block text-xs text-gray-600 mb-1">Nama</label>
          <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Email</label>
          <input className="border rounded px-3 py-2 w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">NIS (opsional)</label>
          <input className="border rounded px-3 py-2 w-full" value={nis} onChange={(e) => setNis(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">NISN (opsional)</label>
          <input className="border rounded px-3 py-2 w-full" value={nisn} onChange={(e) => setNisn(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Gender (opsional)</label>
          <select className="border rounded px-3 py-2 w-full" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">(tidak ditentukan)</option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" disabled={create.isPending}>Tambah</button>
      </form>

      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Email</th>
              <th className="text-left p-2 border-b">NIS</th>
              <th className="text-left p-2 border-b">NISN</th>
              <th className="text-left p-2 border-b">Gender</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border-b">{s.user?.name ?? "-"}</td>
                <td className="p-2 border-b">{s.user?.email}</td>
                <td className="p-2 border-b">{s.nis ?? "-"}</td>
                <td className="p-2 border-b">{s.nisn ?? "-"}</td>
                <td className="p-2 border-b">{s.gender ?? "-"}</td>
                <td className="p-2 border-b">
                  <button className="text-xs px-2 py-1 rounded border border-red-500 text-red-600" onClick={() => remove.mutate(s.id)} disabled={remove.isPending}>
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
