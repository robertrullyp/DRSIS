"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type Me = { employee: { id: string } | null };
type Attn = { id?: string; date?: string; status?: string | null; checkInAt?: string | null; checkOutAt?: string | null; shiftId?: string | null } | null;
type Shift = { id: string; name: string; startTime: string; endTime: string };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function StaffCheckinPage() {
  const qc = useQueryClient();
  const { data: me } = useQuery<Me>({ queryKey: ["staff-me"], queryFn: async () => (await fetch("/api/portal/staff/me")).json() });
  const empId = me?.employee?.id;
  const [date] = useState(todayStr());
  const { data: attn } = useQuery<{ items: any[] }>({
    queryKey: ["staff-attn", empId, date],
    enabled: Boolean(empId),
    queryFn: async () => {
      const res = await fetch(`/api/portal/staff/attendance?date=${date}&pageSize=1`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: any[] };
    },
  });
  const today = (attn?.items ?? [])[0] as Attn | undefined;

  const { data: shifts } = useQuery<{ items: Shift[] }>({ queryKey: ["portal-staff-shifts"], queryFn: async () => (await fetch("/api/portal/staff/shifts?pageSize=200")).json() });
  const [shiftId, setShiftId] = useState<string>("");
  const defaultShift = useMemo(() => (shifts?.items ?? [])[0]?.id ?? "", [shifts]);

  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  async function captureGeo() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return null;
    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setGeo(coords);
          resolve(coords);
        },
        () => resolve(null),
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 6000 }
      );
    });
  }

  const check = useMutation({
    mutationFn: async (action: "checkin" | "checkout") => {
      const coords = (await captureGeo()) ?? geo;
      const body = {
        action,
        method: coords ? "WEB+GPS" : "WEB",
        date,
        shiftId: shiftId || defaultShift || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
      };
      const res = await fetch("/api/portal/staff/attendance/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed");
      return await res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-attn", empId, date] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Portal Pegawai: Check-in/Out</h1>
      <div className="grid md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Shift</label>
          <select className="border rounded px-3 py-2 w-full" value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
            <option value="">(Pilih)</option>
            {(shifts?.items ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 flex flex-wrap items-end gap-2">
          <button type="button" className="rounded-md px-3 py-2 border border-border hover:bg-muted" onClick={() => captureGeo()}>
            Ambil Lokasi
          </button>
          {geo ? <span className="text-xs text-muted-foreground">Lokasi: {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}</span> : <span className="text-xs text-muted-foreground">Lokasi belum diambil</span>}
          <button className="rounded-md px-4 py-2 bg-green-600 text-white hover:opacity-90 disabled:opacity-50" onClick={() => check.mutate("checkin")} disabled={check.isPending || !empId}>Check-in</button>
          <button className="rounded-md px-4 py-2 bg-accent text-white hover:opacity-90 disabled:opacity-50" onClick={() => check.mutate("checkout")} disabled={check.isPending || !empId}>Check-out</button>
        </div>
      </div>

      <div className="border rounded-md p-4">
        <div className="font-medium mb-2">Status Hari Ini</div>
        <div className="text-sm">Tanggal: {date}</div>
        <div className="text-sm">Status: {today?.status ?? "-"}</div>
        <div className="text-sm">Check-in: {today?.checkInAt ? new Date(today.checkInAt).toLocaleTimeString() : "-"}</div>
        <div className="text-sm">Check-out: {today?.checkOutAt ? new Date(today.checkOutAt).toLocaleTimeString() : "-"}</div>
        {typeof (today as any)?.latitude === "number" && typeof (today as any)?.longitude === "number" ? (
          <div className="text-sm">Lokasi: {(today as any).latitude.toFixed(5)}, {(today as any).longitude.toFixed(5)} {" "}
            <a className="text-accent underline" href={`https://www.google.com/maps?q=${(today as any).latitude},${(today as any).longitude}`} target="_blank" rel="noreferrer">(Map)</a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
