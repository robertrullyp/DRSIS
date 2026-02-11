"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Me = { employee: { id: string } | null };
type Row = { id: string; date: string; status: string; checkInAt?: string | null; checkOutAt?: string | null; shift?: { startTime: string; endTime: string }; latitude?: number | null; longitude?: number | null };

function firstDayOfMonth(d = new Date()) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }
function lastDayOfMonth(d = new Date()) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59)); }
function hoursBetween(a?: string | null, b?: string | null) { if (!a || !b) return 0; const aa = new Date(a), bb = new Date(b); const ms = bb.getTime() - aa.getTime(); return ms > 0 ? ms / 3600000 : 0; }

export default function StaffTimesheetPage() {
  const { data: me } = useQuery<Me>({ queryKey: ["staff-me"], queryFn: async () => (await fetch("/api/portal/staff/me")).json() });
  const empId = me?.employee?.id;

  const [range, setRange] = useState<{ start: string; end: string }>(() => {
    const s = firstDayOfMonth(); const e = lastDayOfMonth();
    return { start: s.toISOString(), end: e.toISOString() };
  });

  const { data } = useQuery<{ items: Row[] }>({
    queryKey: ["my-timesheet", empId, range.start, range.end],
    enabled: Boolean(empId),
    queryFn: async () => {
      const url = `/api/hr/attendance?employeeId=${encodeURIComponent(empId!)}&start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}&pageSize=500`;
      const res = await fetch(url); if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Row[] };
    },
  });

  const rows = (data?.items ?? []).sort((a, b) => a.date.localeCompare(b.date));
  const totals = useMemo(() => ({ hours: rows.reduce((s, r) => s + hoursBetween(r.checkInAt, r.checkOutAt), 0) }), [rows]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Portal Pegawai: Timesheet</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Mulai</label>
          <input type="datetime-local" className="border rounded px-3 py-2" value={range.start.slice(0,16)} onChange={(e)=> setRange(r => ({...r, start: new Date(e.target.value).toISOString()}))} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Selesai</label>
          <input type="datetime-local" className="border rounded px-3 py-2" value={range.end.slice(0,16)} onChange={(e)=> setRange(r => ({...r, end: new Date(e.target.value).toISOString()}))} />
        </div>
        <div className="ml-auto text-sm">Total Jam: {totals.hours.toFixed(2)}</div>
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-2 border-b">Tanggal</th>
            <th className="text-left p-2 border-b">Status</th>
            <th className="text-left p-2 border-b">Check-in</th>
            <th className="text-left p-2 border-b">Check-out</th>
            <th className="text-left p-2 border-b">Jam Kerja</th>
            <th className="text-left p-2 border-b">Lokasi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="p-2 border-b">{new Date(r.date).toLocaleDateString()}</td>
              <td className="p-2 border-b">{r.status}</td>
              <td className="p-2 border-b">{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString() : "-"}</td>
              <td className="p-2 border-b">{r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString() : "-"}</td>
              <td className="p-2 border-b">{hoursBetween(r.checkInAt, r.checkOutAt).toFixed(2)}</td>
              <td className="p-2 border-b">
                {typeof r.latitude === "number" && typeof r.longitude === "number" ? (
                  <a className="text-accent underline" href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer">
                    {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                  </a>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td className="p-2" colSpan={6}>Tidak ada data.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
