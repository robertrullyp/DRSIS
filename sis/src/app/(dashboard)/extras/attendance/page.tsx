"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Extra = { id: string; name: string };
type Row = { studentId: string; studentName: string; status: string | null };

const statuses = [
  { value: "PRESENT", label: "Hadir" },
  { value: "EXCUSED", label: "Izin" },
  { value: "SICK", label: "Sakit" },
  { value: "ABSENT", label: "Alfa" },
  { value: "LATE", label: "Terlambat" },
];

export default function ExtraAttendancePage() {
  const qc = useQueryClient();
  const { data: extras } = useQuery<{ items: Extra[] }>({ queryKey: ["extras"], queryFn: async () => (await (await fetch("/api/extras")).json()) as { items: Extra[] } });
  const [extraId, setExtraId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => { if (!extraId && extras?.items?.length) setExtraId(extras.items[0].id); }, [extras, extraId]);

  const { data, isFetching } = useQuery<{ items: Row[]; summary: Record<string, number> }>({
    queryKey: ["extra-attn", extraId, date],
    queryFn: async () => {
      if (!extraId || !date) return { items: [], summary: {} as Record<string, number> } as any;
      const res = await fetch(`/api/extras/${extraId}/attendance?date=${encodeURIComponent(date)}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Row[]; summary: Record<string, number> };
    },
    enabled: Boolean(extraId && date),
  });

  const [draft, setDraft] = useState<Record<string, { status: string | null }>>({});
  useEffect(() => {
    const map: Record<string, { status: string | null }> = {};
    (data?.items ?? []).forEach((r) => (map[r.studentId] = { status: r.status }));
    setDraft(map);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const items = Object.entries(draft).map(([studentId, v]) => ({ studentId, date, status: (v.status ?? "ABSENT") as any }));
      const res = await fetch(`/api/extras/${extraId}/attendance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["extra-attn", extraId, date] }),
  });

  const summaryText = useMemo(() => {
    const s = data?.summary || {};
    return `H:${s.PRESENT ?? 0} I:${s.EXCUSED ?? 0} S:${s.SICK ?? 0} A:${s.ABSENT ?? 0} T:${s.LATE ?? 0}`;
  }, [data]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Presensi Ekstrakurikuler</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Kegiatan</label>
          <Select value={extraId} onChange={(e) => setExtraId(e.target.value)}>
            {extras?.items?.map((x) => (
              <option key={x.id} value={x.id}>{x.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tanggal</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="text-sm text-gray-600">Ringkas: {summaryText}</div>
        <Button className="ml-auto" onClick={() => save.mutate()} disabled={save.isPending}>Simpan</Button>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Siswa</th>
              <th className="text-left p-2 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((r) => (
              <tr key={r.studentId}>
                <td className="p-2 border-b">{r.studentName}</td>
                <td className="p-2 border-b">
                  <Select value={draft[r.studentId]?.status ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [r.studentId]: { status: e.target.value || null } }))}>
                    <option value="">(pilih)</option>
                    {statuses.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
