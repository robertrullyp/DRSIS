"use client";

import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

type Row = { employeeId: string; name: string; days: number; present: number; late: number; absent: number; hours: number; coreMet: number };

export default function TimesheetsPage() {
  const [start, setStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const params = useMemo(() => new URLSearchParams({ start, end }).toString(), [start, end]);
  const { data, isFetching } = useQuery<{ items: Row[] }>({
    queryKey: ["timesheets", params],
    queryFn: async () => {
      const res = await fetch(`/api/hr/timesheets?${params}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Row[] };
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">HR: Timesheet</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Mulai</label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Selesai</label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Pegawai</th>
              <th className="text-left p-2 border-b">Hari</th>
              <th className="text-left p-2 border-b">Hadir</th>
              <th className="text-left p-2 border-b">Terlambat</th>
              <th className="text-left p-2 border-b">Alfa</th>
              <th className="text-left p-2 border-b">Jam</th>
              <th className="text-left p-2 border-b">Core Met</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((r) => (
              <tr key={r.employeeId}>
                <td className="p-2 border-b">{r.name}</td>
                <td className="p-2 border-b">{r.days}</td>
                <td className="p-2 border-b">{r.present}</td>
                <td className="p-2 border-b">{r.late}</td>
                <td className="p-2 border-b">{r.absent}</td>
                <td className="p-2 border-b">{r.hours.toFixed(2)}</td>
                <td className="p-2 border-b">{r.coreMet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
