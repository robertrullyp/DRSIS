"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortalStudentScopeBanner, usePortalStudentScope } from "@/components/portal/student-scope";

type Assessment = {
  id: string;
  subjectId: string;
  score: number;
  weight?: number | null;
  subject?: { name?: string | null };
};

export default function MyGradesPage() {
  const { me, isLoading, selectedChildId, childScopedUrl, setSelectedChildId } = usePortalStudentScope();

  const { data } = useQuery<{ items: Assessment[] }>({
    queryKey: ["my-grades", selectedChildId],
    enabled: Boolean(me?.student),
    queryFn: async () => {
      const res = await fetch(childScopedUrl("/api/portal/student/grades"));
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Assessment[] };
    },
  });

  const rows = useMemo(() => {
    const aggregate = new Map<string, { name: string; sum: number; wsum: number }>();
    (data?.items ?? []).forEach((assessment) => {
      const weight = assessment.weight ?? 1;
      const name = assessment.subject?.name ?? assessment.subjectId;
      const current = aggregate.get(assessment.subjectId) || { name, sum: 0, wsum: 0 };
      current.sum += assessment.score * weight;
      current.wsum += weight;
      aggregate.set(assessment.subjectId, current);
    });
    return Array.from(aggregate.values()).map((row) => ({ name: row.name, avg: row.wsum > 0 ? row.sum / row.wsum : 0 }));
  }, [data]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Nilai</h1>
      <PortalStudentScopeBanner me={me} isLoading={isLoading} onSelectChild={setSelectedChildId} />
      <table className="w-full border text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="border-b p-2 text-left">Mata Pelajaran</th>
            <th className="border-b p-2 text-left">Rata-rata</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="border-b p-2">{row.name}</td>
              <td className="border-b p-2">{row.avg.toFixed(2)}</td>
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
