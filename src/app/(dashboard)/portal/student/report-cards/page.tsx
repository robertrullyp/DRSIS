"use client";

import { useQuery } from "@tanstack/react-query";

type Me = { student: { id: string } | null };
type RCRow = { id: string; classroom: { name: string }; semester: { name: string }; overallScore?: number | null; pdfUrl?: string | null };

export default function MyReportCardsPage() {
  const { data: me } = useQuery<Me>({ queryKey: ["portal-me"], queryFn: async () => (await fetch("/api/portal/me")).json() });
  const studentId = me?.student?.id;
  const { data } = useQuery<{ items: RCRow[] }>({
    queryKey: ["my-report-cards", studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const p = new URLSearchParams({ studentId: studentId!, pageSize: "100" });
      const res = await fetch(`/api/report-cards?${p.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: RCRow[] };
    },
  });

  if (me && !me.student) {
    return <div className="space-y-2"><h1 className="text-lg font-semibold">Raport</h1><div className="text-sm text-gray-600">Akun ini tidak terkait dengan siswa.</div></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Raport</h1>
      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2 border-b">Kelas</th>
            <th className="text-left p-2 border-b">Semester</th>
            <th className="text-left p-2 border-b">Nilai Akhir</th>
            <th className="text-left p-2 border-b">PDF</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((r) => (
            <tr key={r.id}>
              <td className="p-2 border-b">{r.classroom.name}</td>
              <td className="p-2 border-b">{r.semester.name}</td>
              <td className="p-2 border-b">{typeof r.overallScore === "number" ? r.overallScore.toFixed(2) : "-"}</td>
              <td className="p-2 border-b">
                <a className="text-blue-600 underline" href={r.pdfUrl || `/api/report-cards/${r.id}/pdf`} target="_blank" rel="noreferrer">Lihat PDF</a>
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

