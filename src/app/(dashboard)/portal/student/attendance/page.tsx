"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Me = {
  student: { id: string } | null;
};

type StudentRow = { studentId: string; studentName: string; status: string | null; notes: string | null };

export default function MyAttendancePage() {
  const { data: me } = useQuery<Me>({ queryKey: ["portal-me"], queryFn: async () => (await fetch("/api/portal/me")).json() });
  const studentId = me?.student?.id;
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isFetching } = useQuery<{ item: StudentRow | null }>({
    queryKey: ["my-attn", studentId, date],
    enabled: Boolean(studentId && date),
    queryFn: async () => {
      const params = new URLSearchParams({ date });
      const res = await fetch(`/api/portal/student/attendance?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { item: StudentRow | null };
    },
  });

  const myRow = data?.item;

  if (me && !me.student) {
    return <div className="space-y-2"><h1 className="text-lg font-semibold">Presensi</h1><div className="text-sm text-muted-foreground">Akun ini tidak terkait dengan siswa.</div></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Presensi</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tanggal</label>
          <input type="date" className="border rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : myRow ? (
        <div className="border rounded-md p-4">
          <div className="text-sm"><span className="text-muted-foreground">Nama:</span> {myRow.studentName || studentId}</div>
          <div className="text-sm"><span className="text-muted-foreground">Status:</span> {myRow.status ?? "-"}</div>
          {myRow.notes ? <div className="text-sm"><span className="text-muted-foreground">Catatan:</span> {myRow.notes}</div> : null}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Belum ada catatan presensi untuk tanggal ini.</div>
      )}
    </div>
  );
}
