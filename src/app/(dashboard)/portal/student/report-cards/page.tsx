"use client";

import { useQuery } from "@tanstack/react-query";
import { PortalStudentScopeBanner, usePortalStudentScope } from "@/components/portal/student-scope";

type ReportCardRow = {
  id: string;
  classroom: { name: string };
  semester: { name: string };
  overallScore?: number | null;
};

export default function MyReportCardsPage() {
  const { me, isLoading, selectedChildId, childScopedUrl, setSelectedChildId } = usePortalStudentScope();

  const { data } = useQuery<{ items: ReportCardRow[] }>({
    queryKey: ["my-report-cards", selectedChildId],
    enabled: Boolean(me?.student),
    queryFn: async () => {
      const res = await fetch(childScopedUrl("/api/portal/student/report-cards"));
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: ReportCardRow[] };
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Raport</h1>
      <PortalStudentScopeBanner me={me} isLoading={isLoading} onSelectChild={setSelectedChildId} />
      <table className="w-full border text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="border-b p-2 text-left">Kelas</th>
            <th className="border-b p-2 text-left">Semester</th>
            <th className="border-b p-2 text-left">Nilai Akhir</th>
            <th className="border-b p-2 text-left">PDF</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((row) => (
            <tr key={row.id}>
              <td className="border-b p-2">{row.classroom.name}</td>
              <td className="border-b p-2">{row.semester.name}</td>
              <td className="border-b p-2">{typeof row.overallScore === "number" ? row.overallScore.toFixed(2) : "-"}</td>
              <td className="border-b p-2">
                <a className="text-accent underline" href={childScopedUrl(`/api/portal/student/report-cards/${row.id}/pdf`)} target="_blank" rel="noreferrer">
                  Lihat PDF
                </a>
              </td>
            </tr>
          ))}
          {(data?.items?.length ?? 0) === 0 && (
            <tr>
              <td className="p-2" colSpan={4}>Belum ada raport.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
