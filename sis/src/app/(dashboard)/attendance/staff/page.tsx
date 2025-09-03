"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type Employee = { id: string; user: { name?: string | null } };
type Shift = { id: string; name: string };

export default function StaffAttendancePage() {
  const [employeeId, setEmployeeId] = useState("");
  const [action, setAction] = useState<"checkin" | "checkout">("checkin");
  const [method, setMethod] = useState("qr");
  const [shiftId, setShiftId] = useState<string>("");

  const { data: employees } = useQuery<{ items: Employee[] }>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/hr/employees");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Employee[] };
    },
  });

  const { data: shifts } = useQuery<{ items: Shift[] }>({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await fetch("/api/hr/shifts");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Shift[] };
    },
  });

  useEffect(() => {
    if (!employeeId && employees?.items?.length) setEmployeeId(employees.items[0].id);
    if (!shiftId && shifts?.items?.length) setShiftId(shifts.items[0].id);
  }, [employees, shifts, employeeId, shiftId]);

  const check = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/hr/attendance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, action, method, shiftId }),
      });
      if (!res.ok) throw new Error("Check failed");
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Absensi Pegawai</h1>
      <div className="grid grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Pegawai</label>
          <select className="border rounded px-3 py-2 w-full" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            {employees?.items?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.user?.name || e.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Shift</label>
          <select className="border rounded px-3 py-2 w-full" value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
            {shifts?.items?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Aksi</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={action}
            onChange={(e) => setAction((e.target.value as "checkin" | "checkout"))}
          >
            <option value="checkin">Check-in</option>
            <option value="checkout">Check-out</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Metode</label>
          <select className="border rounded px-3 py-2 w-full" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="qr">QR</option>
            <option value="pin">PIN</option>
            <option value="gps">GPS</option>
          </select>
        </div>
        <div className="col-span-4">
          <button className="bg-black text-white rounded px-4 py-2" onClick={() => check.mutate()} disabled={check.isPending}>
            Simpan {action === "checkin" ? "Check-in" : "Check-out"}
          </button>
        </div>
      </div>
    </div>
  );
}
