"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type AcademicYear = { id: string; name: string; startDate: string; endDate: string; isActive: boolean };

async function fetchAY() {
  const res = await fetch("/api/master/academic-years");
  if (!res.ok) throw new Error("Failed");
  return (await res.json()) as { items: AcademicYear[] };
}

export default function AcademicYearsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["ay"], queryFn: fetchAY });
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/master/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate }),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      setName("");
      setStartDate("");
      setEndDate("");
      qc.invalidateQueries({ queryKey: ["ay"] });
    },
  });

  const activate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/master/academic-years/${id}/activate`, { method: "POST" });
      if (!res.ok) throw new Error("Activate failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ay"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/master/academic-years/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ay"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Master: Tahun Ajaran</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name || !startDate || !endDate) return;
          create.mutate();
        }}
        className="grid grid-cols-4 gap-2 items-end"
      >
        <div className="col-span-1">
          <label className="block text-xs text-gray-600 mb-1">Nama</label>
          <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Mulai</label>
          <input type="date" className="border rounded px-3 py-2 w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Selesai</label>
          <input type="date" className="border rounded px-3 py-2 w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className="bg-black text-white rounded px-4 py-2" disabled={create.isPending}>
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
              <th className="text-left p-2 border-b">Mulai</th>
              <th className="text-left p-2 border-b">Selesai</th>
              <th className="text-left p-2 border-b">Aktif</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((x) => (
              <tr key={x.id}>
                <td className="p-2 border-b">{x.name}</td>
                <td className="p-2 border-b">{new Date(x.startDate).toLocaleDateString()}</td>
                <td className="p-2 border-b">{new Date(x.endDate).toLocaleDateString()}</td>
                <td className="p-2 border-b">{x.isActive ? "Ya" : "-"}</td>
                <td className="p-2 border-b space-x-2">
                  <button
                    className="text-xs px-2 py-1 rounded border"
                    onClick={() => activate.mutate(x.id)}
                    disabled={x.isActive || activate.isPending}
                  >
                    Aktifkan
                  </button>
                  <button
                    className="text-xs px-2 py-1 rounded border border-red-500 text-red-600"
                    onClick={() => remove.mutate(x.id)}
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
