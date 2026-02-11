"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

type Me = {
  student: { id: string } | null;
  activeEnrollment: { classroomId: string; classroom: { name: string } } | null;
};

type Schedule = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: { name: string };
  teacher: { user: { name?: string | null } };
};

const days = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" },
];

export default function MySchedulePage() {
  const { data: me } = useQuery<Me>({ queryKey: ["portal-me"], queryFn: async () => (await fetch("/api/portal/me")).json() });
  const classId = me?.activeEnrollment?.classroomId;

  const { data } = useQuery<{ items: Schedule[] }>({
    queryKey: ["my-schedule", classId],
    enabled: Boolean(classId),
    queryFn: async () => {
      const res = await fetch("/api/portal/student/schedule");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Schedule[] };
    },
  });

  const grouped = useMemo(() => {
    const g: Record<number, Schedule[]> = {};
    (data?.items ?? []).forEach((s) => {
      g[s.dayOfWeek] = g[s.dayOfWeek] || [];
      g[s.dayOfWeek].push(s);
    });
    Object.values(g).forEach((arr) => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return g;
  }, [data]);

  if (me && !me.student) {
    return <div className="space-y-2"><h1 className="text-lg font-semibold">Jadwalku</h1><div className="text-sm text-muted-foreground">Akun ini tidak terkait dengan siswa.</div></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Jadwalku {me?.activeEnrollment?.classroom?.name ? `- ${me.activeEnrollment.classroom.name}` : ""}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {days.map((d) => (
          <div key={d.value} className="border rounded-md">
            <div className="bg-muted/50 px-3 py-2 font-medium">{d.label}</div>
            <div>
              {(grouped[d.value] ?? []).length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">Tidak ada jadwal</div>
              ) : (
                <ul>
                  {(grouped[d.value] ?? []).map((s) => (
                    <li key={s.id} className="px-3 py-2 border-t text-sm flex justify-between">
                      <div>
                        <div className="font-medium">{s.subject?.name}</div>
                        <div className="text-muted-foreground">{s.teacher?.user?.name ?? "-"}</div>
                      </div>
                      <div className="text-foreground/80">{s.startTime} - {s.endTime}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
