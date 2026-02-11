"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type Classroom = { id: string; name: string; academicYear?: { id: string; name: string } | null };
type Semester = { id: string; name: string; academicYearId: string };
type RCRow = { id: string; student: { id: string; user: { name?: string | null } }; classroom: { name: string }; semester: { name: string }; overallScore?: number | null; pdfUrl?: string | null };

function resolveReportPdfHref(id: string, pdfUrl?: string | null) {
  if (pdfUrl && /^https?:\/\//i.test(pdfUrl)) return pdfUrl;
  return `/api/report-cards/${id}/pdf`;
}

export default function ReportCardsPage() {
  const qc = useQueryClient();
  const { data: classes } = useQuery<{ items: Classroom[] }>({
    queryKey: ["classrooms-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/classrooms");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Classroom[] };
    },
  });
  const { data: semesters } = useQuery<{ items: Semester[] }>({
    queryKey: ["semesters-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/semesters");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Semester[] };
    },
  });

  const [classId, setClassId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const selectedClass = useMemo(() => classes?.items?.find((c) => c.id === classId), [classes, classId]);
  const ayId = selectedClass?.academicYear?.id;
  const filteredSemesters = useMemo(() => (semesters?.items || []).filter((s) => !ayId || s.academicYearId === ayId), [semesters, ayId]);

  useEffect(() => {
    if (!classId && classes?.items?.length) setClassId(classes.items[0].id);
  }, [classes, classId]);
  useEffect(() => {
    if (!semesterId && filteredSemesters.length) setSemesterId(filteredSemesters[0].id);
  }, [filteredSemesters, semesterId]);

  const { data, isFetching } = useQuery<{ items: RCRow[] }>({
    queryKey: ["report-cards", classId, semesterId],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (classId) p.set("classroomId", classId);
      if (semesterId) p.set("semesterId", semesterId);
      const res = await fetch(`/api/report-cards?${p.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: RCRow[] };
    },
    enabled: Boolean(classId && semesterId),
  });

  const generate = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/report-cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classroomId: classId, semesterId }) });
      if (!res.ok) throw new Error("Generate failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-cards", classId, semesterId] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Raport</h1>
      <div className="grid grid-cols-4 gap-2 items-end">
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
          <label className="block text-xs text-muted-foreground mb-1">Semester</label>
          <select className="border rounded px-3 py-2 w-full" value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
            {filteredSemesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" onClick={() => generate.mutate()} disabled={generate.isPending || !classId || !semesterId}>
            Generate Raport
          </button>
        </div>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Siswa</th>
              <th className="text-left p-2 border-b">Kelas</th>
              <th className="text-left p-2 border-b">Semester</th>
              <th className="text-left p-2 border-b">Nilai Akhir</th>
              <th className="text-left p-2 border-b">PDF</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((r) => (
              <tr key={r.id}>
                <td className="p-2 border-b">{r.student.user?.name ?? r.student.id}</td>
                <td className="p-2 border-b">{r.classroom.name}</td>
                <td className="p-2 border-b">{r.semester.name}</td>
                <td className="p-2 border-b">{typeof r.overallScore === "number" ? r.overallScore.toFixed(2) : "-"}</td>
                <td className="p-2 border-b">
                  <a
                    className="text-accent underline"
                    href={resolveReportPdfHref(r.id, r.pdfUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Lihat PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
