"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type Student = { id: string; user: { name?: string | null } };
type Classroom = { id: string; name: string };
type AcademicYear = { id: string; name: string };
type EnrollmentRow = { id: string; active: boolean; student: Student; classroom: Classroom; academicYear: AcademicYear };

export default function EnrollmentsPage() {
  const qc = useQueryClient();

  const { data: students } = useQuery<{ items: Student[] }>({
    queryKey: ["students-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/students");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Student[] };
    },
  });
  const { data: classes } = useQuery<{ items: Classroom[] }>({
    queryKey: ["classrooms-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/classrooms");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Classroom[] };
    },
  });
  const { data: years } = useQuery<{ items: AcademicYear[] }>({
    queryKey: ["ay-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/academic-years");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: AcademicYear[] };
    },
  });

  const [studentId, setStudentId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");

  useEffect(() => {
    if (!studentId && students?.items?.length) setStudentId(students.items[0].id);
    if (!classroomId && classes?.items?.length) setClassroomId(classes.items[0].id);
    if (!academicYearId && years?.items?.length) setAcademicYearId(years.items[0].id);
  }, [students, classes, years, studentId, classroomId, academicYearId]);

  const { data, isLoading } = useQuery<{ items: EnrollmentRow[] }>({
    queryKey: ["enrollments"],
    queryFn: async () => {
      const res = await fetch("/api/master/enrollments");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: EnrollmentRow[] };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/master/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, classroomId, academicYearId }),
      });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enrollments"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/master/enrollments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enrollments"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Master: Enrollments</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!studentId || !classroomId || !academicYearId) return;
          create.mutate();
        }}
        className="grid grid-cols-4 gap-2 items-end"
      >
        <div>
          <label className="block text-xs text-gray-600 mb-1">Siswa</label>
          <select className="border rounded px-3 py-2 w-full" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {students?.items?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.user?.name || s.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Kelas</label>
          <select className="border rounded px-3 py-2 w-full" value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
            {classes?.items?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tahun Ajaran</label>
          <select className="border rounded px-3 py-2 w-full" value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
            {years?.items?.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>
        <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" disabled={create.isPending}>Tambah</button>
      </form>

      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Siswa</th>
              <th className="text-left p-2 border-b">Kelas</th>
              <th className="text-left p-2 border-b">Tahun Ajaran</th>
              <th className="text-left p-2 border-b">Aktif</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((e) => (
              <tr key={e.id}>
                <td className="p-2 border-b">{e.student.user?.name ?? e.student.id}</td>
                <td className="p-2 border-b">{e.classroom.name}</td>
                <td className="p-2 border-b">{e.academicYear.name}</td>
                <td className="p-2 border-b">{e.active ? "Ya" : "-"}</td>
                <td className="p-2 border-b">
                  <button className="text-xs px-2 py-1 rounded border border-red-500 text-red-600" onClick={() => remove.mutate(e.id)} disabled={remove.isPending}>
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
