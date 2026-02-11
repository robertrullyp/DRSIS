"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";

type Employee = { id: string; user: { name?: string | null } };
type Shift = { id: string; name: string };
type StaffAttendance = {
  id: string;
  date: string;
  status: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  method?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  employee?: { user?: { name?: string | null } | null } | null;
  shift?: Shift | null;
};

type ListResponse = {
  items: StaffAttendance[];
  total: number;
  page: number;
  pageSize: number;
};

export default function HrAttendancePage() {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Options
  const { data: employees } = useQuery<{ items: Employee[] }>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/hr/employees");
      if (!res.ok) throw new Error("Failed to load employees");
      return (await res.json()) as { items: Employee[] };
    },
  });

  useEffect(() => {
    if (!employeeId && employees?.items?.length) setEmployeeId("");
  }, [employees, employeeId]);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (employeeId) p.set("employeeId", employeeId);
    if (start && end) {
      p.set("start", start);
      p.set("end", end);
    } else if (date) {
      p.set("date", date);
    }
    return p;
  }, [employeeId, date, start, end, page, pageSize]);

  const { data, isFetching } = useQuery<ListResponse>({
    queryKey: ["hr-attendance", queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/hr/attendance?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load attendance");
      return (await res.json()) as ListResponse;
    },
  });

  async function exportCsv() {
    const p = new URLSearchParams();
    const today = new Date().toISOString().slice(0, 10);
    // default last 7 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    p.set("start", start.toISOString().slice(0, 10));
    p.set("end", today);
    const res = await fetch(`/api/hr/attendance/export?${p.toString()}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${p.get('start')}_to_${p.get('end')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  function fmtDate(s?: string | null) {
    if (!s) return "-";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Rekap Absensi Pegawai</h1>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Pegawai (opsional)</label>
          <Select
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">(Semua)</option>
            {employees?.items?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.user?.name || e.id}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Tanggal (tepat)</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              // clear range when exact date set
              if (e.target.value) {
                setStart("");
                setEnd("");
              }
              setPage(1);
            }}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Mulai (range)</label>
          <Input
            type="date"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              if (e.target.value) setDate("");
              setPage(1);
            }}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Selesai (range)</label>
          <Input
            type="date"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              if (e.target.value) setDate("");
              setPage(1);
            }}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Page Size</label>
          <Select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-2 items-center md:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setEmployeeId("");
              setDate("");
              setStart("");
              setEnd("");
              setPage(1);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Total: {data?.total ?? 0} | Halaman {data?.page ?? page} dari {totalPages}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>Export CSV 7 hari</Button>
          <button
            className="border rounded px-3 py-1 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            className="border rounded px-3 py-1 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Tanggal</th>
              <th className="text-left p-2 border-b">Pegawai</th>
              <th className="text-left p-2 border-b">Shift</th>
              <th className="text-left p-2 border-b">Status</th>
              <th className="text-left p-2 border-b">Check-in</th>
              <th className="text-left p-2 border-b">Check-out</th>
              <th className="text-left p-2 border-b">Metode</th>
              <th className="text-left p-2 border-b">Catatan</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((r) => (
              <tr key={r.id}>
                <td className="p-2 border-b">{fmtDate(r.date)}</td>
                <td className="p-2 border-b">{r.employee?.user?.name ?? "-"}</td>
                <td className="p-2 border-b">{r.shift?.name ?? "-"}</td>
                <td className="p-2 border-b">{r.status}</td>
                <td className="p-2 border-b">{fmtDate(r.checkInAt)}</td>
                <td className="p-2 border-b">{fmtDate(r.checkOutAt)}</td>
                <td className="p-2 border-b">{r.method ?? "-"}</td>
                <td className="p-2 border-b">{r.notes ?? "-"}</td>
                <td className="p-2 border-b">
                  <Button
                    className="text-xs px-2 py-1"
                    variant="outline"
                    onClick={async () => {
                      await fetch(`/api/hr/attendance/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approve: true }) });
                    }}
                  >
                    Approve
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
