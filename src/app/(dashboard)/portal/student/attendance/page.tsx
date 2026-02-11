"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Me = {
  student: { id: string } | null;
  activeEnrollment: { classroomId: string } | null;
};

type StudentRow = { studentId: string; studentName: string; status: string | null; notes: string | null };

export default function MyAttendancePage() {
  const { data: me } = useQuery<Me>({ queryKey: ["portal-me"], queryFn: async () => (await fetch("/api/portal/me")).json() });
  const classId = me?.activeEnrollment?.classroomId;
  const studentId = me?.student?.id;
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isFetching } = useQuery<{ items: StudentRow[]; summary: Record<string, number> } | null>({
    queryKey: ["my-attn", classId, date],
    enabled: Boolean(classId && date),
    queryFn: async () => {
      if (!classId || !date) return null;
      const params = new URLSearchParams({ classId, date });
      const res = await fetch(`/api/attendance/student?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: StudentRow[]; summary: Record<string, number> };
    },
  });

  const myRow = useMemo(() => (data?.items ?? []).find((r) => r.studentId === studentId), [data, studentId]);

  if (me && !me.student) {
    return <div className="space-y-2"><h1 className="text-lg font-semibold">Presensi</h1><div className="text-sm text-gray-600">Akun ini tidak terkait dengan siswa.</div></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Presensi</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tanggal</label>
          <input type="date" className="border rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : myRow ? (
        <div className="border rounded-md p-4">
          <div className="text-sm"><span className="text-gray-600">Nama:</span> {myRow.studentName || studentId}</div>
          <div className="text-sm"><span className="text-gray-600">Status:</span> {myRow.status ?? "-"}</div>
          {myRow.notes ? <div className="text-sm"><span className="text-gray-600">Catatan:</span> {myRow.notes}</div> : null}
        </div>
      ) : (
        <div className="text-sm text-gray-600">Belum ada catatan presensi untuk tanggal ini.</div>
      )}
    </div>
  );
}

