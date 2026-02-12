"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DataTable,
  DataTableCell,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeaderCell,
  DataTablePagination,
  DataTableRow,
} from "@/components/ui/data-table";

type ClassroomSummary = { id: string; code: string; name: string } | null;
type SubjectSummary = { id: string; code: string; name: string } | null;

type LmsLinkRow = {
  id: string;
  external: string;
  externalId: string;
  classroomId: string | null;
  subjectId: string | null;
  classroom: ClassroomSummary;
  subject: SubjectSummary;
  scoreCount: number;
};

type LmsLinkListResponse = {
  items: LmsLinkRow[];
  total: number;
  page: number;
  pageSize: number;
};

export default function AdminLmsLinksPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [page, pageSize, q]);

  const linksQuery = useQuery<LmsLinkListResponse>({
    queryKey: ["admin-lms-links", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/lms/links?${queryString}`);
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(typeof payload?.error === "string" ? payload.error : "Failed to fetch LMS links");
      }
      return (await res.json()) as LmsLinkListResponse;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/lms/links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete link");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-lms-links"] }),
  });

  const rows = linksQuery.data?.items ?? [];
  const total = linksQuery.data?.total ?? 0;
  const currentPage = linksQuery.data?.page ?? page;
  const currentPageSize = linksQuery.data?.pageSize ?? pageSize;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage * currentPageSize < total;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Admin: LMS/CBT Links</h1>
          <p className="text-sm text-muted-foreground">Mapping link ujian/kelas/mapel eksternal dan impor skor.</p>
        </div>
        <Link href="/admin/lms/links/new" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90">
          Buat Link
        </Link>
      </div>

      <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="space-y-1 lg:col-span-2">
          <span className="text-xs text-muted-foreground">Cari</span>
          <input
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            placeholder="external / externalId"
          />
        </label>
        <button
          type="button"
          className="self-end rounded-md border px-3 py-2 text-sm hover:bg-muted/70 lg:col-span-1"
          onClick={() => {
            setQ("");
            setPage(1);
            setPageSize(20);
          }}
        >
          Reset
        </button>
      </div>

      <DataTablePagination
        page={currentPage}
        pageSize={currentPageSize}
        total={total}
        visibleCount={rows.length}
        itemLabel="link"
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPageChange={(nextPage) => setPage(Math.max(1, nextPage))}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />

      <DataTable minWidthClassName="min-w-[1080px]">
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>External</DataTableHeaderCell>
            <DataTableHeaderCell>External ID</DataTableHeaderCell>
            <DataTableHeaderCell>Kelas</DataTableHeaderCell>
            <DataTableHeaderCell>Mapel</DataTableHeaderCell>
            <DataTableHeaderCell>Skor</DataTableHeaderCell>
            <DataTableHeaderCell>Aksi</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <tbody>
          {rows.length === 0 ? (
            <DataTableEmptyRow message={linksQuery.isLoading ? "Memuat..." : "Belum ada link."} colSpan={6} />
          ) : (
            rows.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell className="font-medium">{row.external}</DataTableCell>
                <DataTableCell>{row.externalId}</DataTableCell>
                <DataTableCell>
                  {row.classroom ? (
                    <span>
                      {row.classroom.code} {row.classroom.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </DataTableCell>
                <DataTableCell>
                  {row.subject ? (
                    <span>
                      {row.subject.code} {row.subject.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </DataTableCell>
                <DataTableCell>{row.scoreCount}</DataTableCell>
                <DataTableCell>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/lms/links/${row.id}/edit`} className="rounded border px-2 py-1 text-xs hover:bg-muted/70">
                      Edit/Import
                    </Link>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-muted/70 disabled:opacity-50"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (!confirm("Hapus link ini? Semua skor terkait akan ikut terhapus.")) return;
                        deleteMutation.mutate(row.id);
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </tbody>
      </DataTable>
    </div>
  );
}

