"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type Classroom = { id: string; name: string };
type Subject = { id: string; name: string };
type Teacher = { id: string; user: { name?: string | null } };
type ScheduleRow = {
  id: string;
  classroom: Classroom;
  subject: Subject;
  teacher: Teacher;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
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

export default function SchedulesPage() {
  const qc = useQueryClient();

  const { data: classes } = useQuery<{ items: Classroom[] }>({
    queryKey: ["classrooms-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/classrooms");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Classroom[] };
    },
  });
  const { data: subjects } = useQuery<{ items: Subject[] }>({
    queryKey: ["subjects-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/subjects");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Subject[] };
    },
  });
  const { data: teachers } = useQuery<{ items: Teacher[] }>({
    queryKey: ["teachers-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/teachers");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Teacher[] };
    },
  });

  const [classroomId, setClassroomId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<number | "">(1);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [filterClassId, setFilterClassId] = useState("");

  useEffect(() => {
    if (!classroomId && classes?.items?.length) setClassroomId(classes.items[0].id);
    if (!subjectId && subjects?.items?.length) setSubjectId(subjects.items[0].id);
    if (!teacherId && teachers?.items?.length) setTeacherId(teachers.items[0].id);
  }, [classes, subjects, teachers, classroomId, subjectId, teacherId]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (filterClassId) p.set("classroomId", filterClassId);
    return p.toString();
  }, [filterClassId]);

  const { data, isLoading } = useQuery<{ items: ScheduleRow[] }>({
    queryKey: ["schedules", params],
    queryFn: async () => {
      const res = await fetch(`/api/master/schedules?${params}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: ScheduleRow[] };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/master/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomId, subjectId, teacherId, dayOfWeek: Number(dayOfWeek), startTime, endTime }),
      });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => {
      setStartTime("");
      setEndTime("");
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/master/schedules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Akademik: Jadwal</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!classroomId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime) return;
          create.mutate();
        }}
        className="grid grid-cols-6 gap-2 items-end"
      >
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Kelas</label>
          <select className="border rounded px-3 py-2 w-full" value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
            {classes?.items?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Mapel</label>
          <select className="border rounded px-3 py-2 w-full" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects?.items?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Guru</label>
          <select className="border rounded px-3 py-2 w-full" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            {teachers?.items?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user?.name || t.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Hari</label>
          <select className="border rounded px-3 py-2 w-full" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
            {days.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Mulai</label>
          <input className="border rounded px-3 py-2 w-full" placeholder="HH:mm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Selesai</label>
          <input className="border rounded px-3 py-2 w-full" placeholder="HH:mm" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div className="col-span-6">
          <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" disabled={create.isPending}>Tambah</button>
        </div>
      </form>

      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Filter Kelas</label>
          <select className="border rounded px-3 py-2" value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)}>
            <option value="">(Semua)</option>
            {classes?.items?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Kelas</th>
              <th className="text-left p-2 border-b">Mapel</th>
              <th className="text-left p-2 border-b">Guru</th>
              <th className="text-left p-2 border-b">Hari</th>
              <th className="text-left p-2 border-b">Waktu</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((r) => (
              <tr key={r.id}>
                <td className="p-2 border-b">{r.classroom?.name}</td>
                <td className="p-2 border-b">{r.subject?.name}</td>
                <td className="p-2 border-b">{r.teacher?.user?.name ?? r.teacher?.id}</td>
                <td className="p-2 border-b">{days.find((d) => d.value === r.dayOfWeek)?.label ?? r.dayOfWeek}</td>
                <td className="p-2 border-b">{r.startTime} - {r.endTime}</td>
                <td className="p-2 border-b">
                  <button className="text-xs px-2 py-1 rounded border border-red-500 text-red-600" onClick={() => remove.mutate(r.id)} disabled={remove.isPending}>
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
