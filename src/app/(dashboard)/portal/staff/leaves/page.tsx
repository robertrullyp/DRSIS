"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type LeaveType = { id: string; name: string };
type Leave = { id: string; type: LeaveType; startDate: string; endDate: string; days: number; status: string; reason?: string | null; createdAt: string };

export default function StaffLeavesPage() {
  const qc = useQueryClient();
  const { data: types } = useQuery<{ items: LeaveType[] }>({ queryKey: ["leave-types"], queryFn: async () => (await fetch("/api/hr/leave-types?pageSize=200")).json() });
  const { data } = useQuery<{ items: Leave[] }>({ queryKey: ["my-leaves"], queryFn: async () => (await fetch("/api/portal/staff/leaves")).json() });

  const [typeId, setTypeId] = useState("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (!typeId && (types?.items ?? []).length) setTypeId(types!.items[0].id);
  }, [types, typeId]);

  const create = useMutation({
    mutationFn: async () => {
      const body = { typeId, startDate: new Date(start).toISOString(), endDate: new Date(end).toISOString(), reason: reason || undefined };
      const res = await fetch("/api/portal/staff/leaves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => {
      setStart(""); setEnd(""); setReason("");
      qc.invalidateQueries({ queryKey: ["my-leaves"] });
    }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Portal Pegawai: Cuti/Izin</h1>
      <form
        onSubmit={(e) => { e.preventDefault(); if (!typeId || !start || !end) return; create.mutate(); }}
        className="grid md:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tipe</label>
          <select className="border rounded px-3 py-2 w-full" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            {(types?.items ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Mulai</label>
          <input type="date" className="border rounded px-3 py-2 w-full" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Selesai</label>
          <input type="date" className="border rounded px-3 py-2 w-full" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Alasan</label>
          <input className="border rounded px-3 py-2 w-full" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="opsional" />
        </div>
        <div className="md:col-span-4">
          <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" disabled={create.isPending}>Ajukan</button>
        </div>
      </form>

      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2 border-b">Diajukan</th>
            <th className="text-left p-2 border-b">Tipe</th>
            <th className="text-left p-2 border-b">Periode</th>
            <th className="text-left p-2 border-b">Hari</th>
            <th className="text-left p-2 border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((r) => (
            <tr key={r.id}>
              <td className="p-2 border-b">{new Date(r.createdAt).toLocaleString()}</td>
              <td className="p-2 border-b">{r.type?.name}</td>
              <td className="p-2 border-b">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
              <td className="p-2 border-b">{r.days}</td>
              <td className="p-2 border-b">{r.status}</td>
            </tr>
          ))}
          {(data?.items?.length ?? 0) === 0 && (
            <tr><td className="p-2" colSpan={5}>Belum ada pengajuan.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

