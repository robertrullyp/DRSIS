"use client";

import { useQuery } from "@tanstack/react-query";
import { PortalStudentScopeBanner, usePortalStudentScope } from "@/components/portal/student-scope";

type BillingItem = {
  id: string;
  code: string;
  total: number;
  status: string;
  dueDate?: string | null;
  academicYear: { name: string };
};

export default function MyBillingPage() {
  const { me, isLoading, selectedChildId, childScopedUrl, setSelectedChildId } = usePortalStudentScope();

  const { data, isFetching } = useQuery<{ items: BillingItem[] }>({
    queryKey: ["portal-billing", selectedChildId],
    enabled: Boolean(me?.student),
    queryFn: async () => {
      const res = await fetch(childScopedUrl("/api/portal/billing"));
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: BillingItem[] };
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Tagihan</h1>
      <PortalStudentScopeBanner me={me} isLoading={isLoading} onSelectChild={setSelectedChildId} />
      {isFetching ? (
        <div>Memuat...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="border-b p-2 text-left">Kode</th>
              <th className="border-b p-2 text-left">Tahun Ajaran</th>
              <th className="border-b p-2 text-left">Jatuh Tempo</th>
              <th className="border-b p-2 text-left">Status</th>
              <th className="border-b p-2 text-left">Total</th>
              <th className="border-b p-2 text-left">Kuitansi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((invoice) => (
              <tr key={invoice.id}>
                <td className="border-b p-2">{invoice.code}</td>
                <td className="border-b p-2">{invoice.academicYear?.name}</td>
                <td className="border-b p-2">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}</td>
                <td className="border-b p-2">{invoice.status}</td>
                <td className="border-b p-2">{(invoice.total / 100).toLocaleString(undefined, { style: "currency", currency: "IDR" })}</td>
                <td className="border-b p-2">
                  <a className="text-accent underline" href={childScopedUrl(`/api/portal/billing/${invoice.id}/receipt`)} target="_blank" rel="noreferrer">Lihat</a>
                </td>
              </tr>
            ))}
            {(data?.items?.length ?? 0) === 0 && (
              <tr>
                <td className="p-2" colSpan={6}>Tidak ada tagihan.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
