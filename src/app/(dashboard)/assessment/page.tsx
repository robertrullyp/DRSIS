"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type Classroom = { id: string; name: string; academicYear?: { id: string; name: string } | null };
type Subject = { id: string; name: string };
type Enrollment = { id: string; student: { id: string; user: { name?: string | null } } };

export default function AssessmentPage() {
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

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [type, setType] = useState("UH");
  const [weight, setWeight] = useState<string>("1");

  const selectedClass = useMemo(() => classes?.items?.find((c) => c.id === classId), [classes, classId]);
  const academicYearId = selectedClass?.academicYear?.id;

  useEffect(() => {
    if (!classId && classes?.items?.length) setClassId(classes.items[0].id);
    if (!subjectId && subjects?.items?.length) setSubjectId(subjects.items[0].id);
  }, [classes, subjects, classId, subjectId]);

  const { data: enrolls, isFetching } = useQuery<{ items: Enrollment[] }>({
    queryKey: ["enrollments", classId, academicYearId],
    queryFn: async () => {
      if (!classId) return { items: [] as Enrollment[] } as { items: Enrollment[] };
      const p = new URLSearchParams({ pageSize: "200" });
      p.set("classroomId", classId);
      if (academicYearId) p.set("academicYearId", academicYearId);
      const res = await fetch(`/api/master/enrollments?${p.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Enrollment[] };
    },
    enabled: Boolean(classId),
  });

  const [scores, setScores] = useState<Record<string, string>>({});
  useEffect(() => {
    // reset scores when class changes
    setScores({});
  }, [classId]);

  const save = useMutation({
    mutationFn: async () => {
      if (!classId || !subjectId || !academicYearId) return;
      const entries = Object.entries(scores).filter(([, v]) => v !== "");
      for (const [studentId, val] of entries) {
        const body = {
          studentId,
          subjectId,
          classroomId: classId,
          academicYearId,
          type,
          weight: Number(weight || "1"),
          score: Number(val),
        };
        const res = await fetch("/api/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error("Save failed");
      }
    },
    onSuccess: () => {
      setScores({});
      qc.invalidateQueries({ queryKey: ["enrollments", classId, academicYearId] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Input Nilai</h1>
      <div className="grid grid-cols-6 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Kelas</label>
          <select className="border rounded px-3 py-2 w-full" value={classId} onChange={(e) => setClassId(e.target.value)}>
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
          <label className="block text-xs text-muted-foreground mb-1">Jenis</label>
          <input className="border rounded px-3 py-2 w-full" value={type} onChange={(e) => setType(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Bobot</label>
          <input className="border rounded px-3 py-2 w-full" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div className="col-span-2 text-sm text-muted-foreground">TA: {selectedClass?.academicYear?.name ?? "-"}</div>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Siswa</th>
              <th className="text-left p-2 border-b">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {(enrolls?.items ?? []).map((en) => (
              <tr key={en.id}>
                <td className="p-2 border-b">{en.student.user?.name ?? en.student.id}</td>
                <td className="p-2 border-b">
                  <input
                    className="border rounded px-2 py-1 w-32"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={scores[en.student.id] ?? ""}
                    onChange={(e) => setScores((s) => ({ ...s, [en.student.id]: e.target.value }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div>
        <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" onClick={() => save.mutate()} disabled={save.isPending || !academicYearId}>
          Simpan Nilai
        </button>
      </div>
    </div>
  );
}
