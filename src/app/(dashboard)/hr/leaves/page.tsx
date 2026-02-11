"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type Leave = { id: string; employee: { id: string; user: { name?: string | null } }; type: { name: string }; startDate: string; endDate: string; days: number; status: string; createdAt: string };

export default function HRLeavesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("PENDING");
  const { data, isFetching } = useQuery<{ items: Leave[] }>({
    queryKey: ["hr-leaves", status],
    queryFn: async () => (await fetch(`/api/hr/leaves?pageSize=200${status ? `&status=${status}` : ""}`)).json(),
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/hr/leaves/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Approve failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-leaves"] }),
  });
  const reject = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/hr/leaves/${id}/reject`, { method: "POST" });
      if (!res.ok) throw new Error("Reject failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-leaves"] }),
  });

  const rows = useMemo(() => (data?.items ?? []), [data]);
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">HR: Pengajuan Cuti/Izin</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Filter Status</label>
          <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            {(["PENDING", "APPROVED", "REJECTED", "CANCELLED", ""] as string[]).map((s) => (
              <option key={s || "ALL"} value={s}>{s || "(Semua)"}</option>
            ))}
          </select>
        </div>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Diajukan</th>
              <th className="text-left p-2 border-b">Pegawai</th>
              <th className="text-left p-2 border-b">Tipe</th>
              <th className="text-left p-2 border-b">Periode</th>
              <th className="text-left p-2 border-b">Hari</th>
              <th className="text-left p-2 border-b">Status</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border-b">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-2 border-b">{r.employee?.user?.name ?? r.employee?.id}</td>
                <td className="p-2 border-b">{r.type?.name}</td>
                <td className="p-2 border-b">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
                <td className="p-2 border-b">{r.days}</td>
                <td className="p-2 border-b">{r.status}</td>
                <td className="p-2 border-b">
                  {r.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <button className="text-xs px-2 py-1 rounded border border-green-600 text-green-700" onClick={() => approve.mutate(r.id)} disabled={approve.isPending}>Approve</button>
                      <button className="text-xs px-2 py-1 rounded border border-red-600 text-red-700" onClick={() => reject.mutate(r.id)} disabled={reject.isPending}>Reject</button>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-2" colSpan={7}>Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
