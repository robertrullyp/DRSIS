"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortalStudentScopeBanner, usePortalStudentScope } from "@/components/portal/student-scope";

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
  const { me, isLoading, selectedChildId, childScopedUrl, setSelectedChildId } = usePortalStudentScope();

  const { data } = useQuery<{ items: Schedule[] }>({
    queryKey: ["my-schedule", selectedChildId],
    enabled: Boolean(me?.student),
    queryFn: async () => {
      const res = await fetch(childScopedUrl("/api/portal/student/schedule"));
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Schedule[] };
    },
  });

  const grouped = useMemo(() => {
    const group: Record<number, Schedule[]> = {};
    (data?.items ?? []).forEach((item) => {
      group[item.dayOfWeek] = group[item.dayOfWeek] || [];
      group[item.dayOfWeek].push(item);
    });
    Object.values(group).forEach((items) => items.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return group;
  }, [data]);

  const selectedChild = me?.children.find((child) => child.id === selectedChildId) ?? null;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Jadwalku {selectedChild?.classroom?.name ? `- ${selectedChild.classroom.name}` : ""}</h1>
      <PortalStudentScopeBanner me={me} isLoading={isLoading} onSelectChild={setSelectedChildId} />
      <div className="grid gap-4 md:grid-cols-2">
        {days.map((day) => (
          <div key={day.value} className="rounded-md border">
            <div className="bg-muted/50 px-3 py-2 font-medium">{day.label}</div>
            <div>
              {(grouped[day.value] ?? []).length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">Tidak ada jadwal</div>
              ) : (
                <ul>
                  {(grouped[day.value] ?? []).map((item) => (
                    <li key={item.id} className="flex justify-between border-t px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium">{item.subject?.name}</div>
                        <div className="text-muted-foreground">{item.teacher?.user?.name ?? "-"}</div>
                      </div>
                      <div className="text-foreground/80">{item.startTime} - {item.endTime}</div>
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
