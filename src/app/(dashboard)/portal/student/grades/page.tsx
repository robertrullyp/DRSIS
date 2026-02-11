"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

type Me = {
  student: { id: string } | null;
  activeEnrollment: { academicYearId: string } | null;
};

type Assessment = {
  id: string;
  subjectId: string;
  score: number;
  weight?: number | null;
  subject?: { name?: string | null };
};

export default function MyGradesPage() {
  const { data: me } = useQuery<Me>({ queryKey: ["portal-me"], queryFn: async () => (await fetch("/api/portal/me")).json() });
  const studentId = me?.student?.id;
  const ayId = me?.activeEnrollment?.academicYearId;

  const { data } = useQuery<{ items: Assessment[] }>({
    queryKey: ["my-grades", studentId, ayId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const res = await fetch("/api/portal/student/grades");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Assessment[] };
    },
  });

  const rows = useMemo(() => {
    const map = new Map<string, { name: string; sum: number; wsum: number }>();
    (data?.items ?? []).forEach((a) => {
      const w = a.weight ?? 1;
      const n = a.subject?.name ?? a.subjectId;
      const cur = map.get(a.subjectId) || { name: n, sum: 0, wsum: 0 };
      cur.sum += a.score * w;
      cur.wsum += w;
      map.set(a.subjectId, cur);
    });
    return Array.from(map.values()).map((r) => ({ name: r.name, avg: r.wsum > 0 ? r.sum / r.wsum : 0 }));
  }, [data]);

  if (me && !me.student) {
    return <div className="space-y-2"><h1 className="text-lg font-semibold">Nilai</h1><div className="text-sm text-muted-foreground">Akun ini tidak terkait dengan siswa.</div></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Nilai</h1>
      <table className="w-full text-sm border">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-2 border-b">Mata Pelajaran</th>
            <th className="text-left p-2 border-b">Rata-rata</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td className="p-2 border-b">{r.name}</td>
              <td className="p-2 border-b">{r.avg.toFixed(2)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="p-2" colSpan={2}>Belum ada data nilai.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
