"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortalStudentScopeBanner, usePortalStudentScope } from "@/components/portal/student-scope";

type StudentAttendanceRow = {
  studentId: string;
  studentName: string;
  status: string | null;
  notes: string | null;
};

export default function MyAttendancePage() {
  const { me, isLoading, selectedChildId, childScopedUrl, setSelectedChildId } = usePortalStudentScope();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isFetching } = useQuery<{ item: StudentAttendanceRow | null }>({
    queryKey: ["my-attendance", selectedChildId, date],
    enabled: Boolean(me?.student && date),
    queryFn: async () => {
      const url = childScopedUrl(`/api/portal/student/attendance?date=${encodeURIComponent(date)}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { item: StudentAttendanceRow | null };
    },
  });

  const item = data?.item;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Presensi</h1>
      <PortalStudentScopeBanner me={me} isLoading={isLoading} onSelectChild={setSelectedChildId} />
      <div className="flex items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tanggal</label>
          <input type="date" className="rounded border px-3 py-2" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
      </div>

      {isFetching ? (
        <div>Memuat...</div>
      ) : item ? (
        <div className="rounded-md border p-4">
          <div className="text-sm"><span className="text-muted-foreground">Nama:</span> {item.studentName || item.studentId}</div>
          <div className="text-sm"><span className="text-muted-foreground">Status:</span> {item.status ?? "-"}</div>
          {item.notes ? <div className="text-sm"><span className="text-muted-foreground">Catatan:</span> {item.notes}</div> : null}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Belum ada catatan presensi untuk tanggal ini.</div>
      )}
    </div>
  );
}
