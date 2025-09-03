"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type Classroom = { id: string; name: string };
type StudentRow = { studentId: string; studentName: string; status: string | null; notes: string | null };

const statuses = [
  { value: "PRESENT", label: "Hadir" },
  { value: "EXCUSED", label: "Izin" },
  { value: "SICK", label: "Sakit" },
  { value: "ABSENT", label: "Alfa" },
  { value: "LATE", label: "Terlambat" },
];

export default function StudentAttendancePage() {
  const qc = useQueryClient();
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: classes } = useQuery<{ items: Classroom[] }>({
    queryKey: ["classrooms-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/classrooms");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Classroom[] };
    },
  });

  useEffect(() => {
    if (!classId && classes?.items?.length) setClassId(classes.items[0].id);
  }, [classes, classId]);

  const { data, isFetching } = useQuery<{ items: StudentRow[]; summary: Record<string, number> }>({
    queryKey: ["attn", classId, date],
    queryFn: async () => {
      if (!classId || !date) return { items: [], summary: {} as Record<string, number> };
      const params = new URLSearchParams({ classId, date });
      const res = await fetch(`/api/attendance/student?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: StudentRow[]; summary: Record<string, number> };
    },
    enabled: Boolean(classId && date),
  });

  const [draft, setDraft] = useState<Record<string, { status: string | null; notes: string }>>({});
  useEffect(() => {
    const map: Record<string, { status: string | null; notes: string }> = {};
    (data?.items ?? []).forEach((r) => (map[r.studentId] = { status: r.status, notes: r.notes ?? "" }));
    setDraft(map);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!classId || !date) return;
      const items = Object.entries(draft).map(([studentId, v]) => ({
        studentId,
        classroomId: classId,
        date,
        status: (v.status ?? "ABSENT") as "PRESENT" | "EXCUSED" | "SICK" | "ABSENT" | "LATE",
        notes: v.notes || undefined,
      }));
      const res = await fetch("/api/attendance/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attn", classId, date] }),
  });

  const summaryText = useMemo(() => {
    const s = data?.summary || {};
    return `H:${s.PRESENT ?? 0} I:${s.EXCUSED ?? 0} S:${s.SICK ?? 0} A:${s.ABSENT ?? 0} T:${s.LATE ?? 0}`;
  }, [data]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Absensi Siswa</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Kelas</label>
          <select className="border rounded px-3 py-2" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes?.items?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tanggal</label>
          <input type="date" className="border rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="text-sm text-gray-600">Ringkas: {summaryText}</div>
        <button className="ml-auto bg-black text-white rounded px-4 py-2" onClick={() => save.mutate()} disabled={save.isPending}>
          Simpan
        </button>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Siswa</th>
              <th className="text-left p-2 border-b">Status</th>
              <th className="text-left p-2 border-b">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((r) => (
              <tr key={r.studentId}>
                <td className="p-2 border-b">{r.studentName}</td>
                <td className="p-2 border-b">
                  <select
                    className="border rounded px-2 py-1"
                    value={draft[r.studentId]?.status ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [r.studentId]: { ...(d[r.studentId] ?? { notes: "" }), status: e.target.value || null } }))}
                  >
                    <option value="">(pilih)</option>
                    {statuses.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border-b">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={draft[r.studentId]?.notes ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [r.studentId]: { ...(d[r.studentId] ?? { status: null }), notes: e.target.value } }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
