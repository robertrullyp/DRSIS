"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  DataTable,
  DataTableCell,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeaderCell,
  DataTablePagination,
  DataTableRow,
} from "@/components/ui/data-table";

type CmsPageItem = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  publishedBy: string | null;
};

type CmsPageResponse = {
  items: CmsPageItem[];
  total: number;
  page: number;
  pageSize: number;
};

type BulkAction = "" | "publish" | "unpublish" | "archive";

export default function AdminCmsPagesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"" | "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("");
  const [isApplyingBulk, setApplyingBulk] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [page, pageSize, status, q]);

  const pagesQuery = useQuery<CmsPageResponse>({
    queryKey: ["admin-cms-pages", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/cms/pages?${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch pages");
      return (await res.json()) as CmsPageResponse;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/cms/pages/${id}/publish`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to publish");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] }),
  });

  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/cms/pages/${id}/unpublish`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to unpublish");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/cms/pages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] }),
  });

  const rows = pagesQuery.data?.items ?? [];
  const total = pagesQuery.data?.total ?? 0;
  const currentPage = pagesQuery.data?.page ?? page;
  const currentPageSize = pagesQuery.data?.pageSize ?? pageSize;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage * currentPageSize < total;
  const selectedSet = new Set(selectedIds);
  const allSelected = rows.length > 0 && rows.every((item) => selectedSet.has(item.id));

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(rows.map((item) => item.id));
  }

  async function applyBulkAction() {
    if (!bulkAction || selectedIds.length === 0) return;
    setApplyingBulk(true);

    await Promise.allSettled(
      selectedIds.map(async (id) => {
        if (bulkAction === "publish") {
          await fetch(`/api/admin/cms/pages/${id}/publish`, { method: "POST" });
          return;
        }
        if (bulkAction === "unpublish") {
          await fetch(`/api/admin/cms/pages/${id}/unpublish`, { method: "POST" });
          return;
        }
        await fetch(`/api/admin/cms/pages/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ARCHIVED" }),
        });
      })
    );

    setApplyingBulk(false);
    setSelectedIds([]);
    setBulkAction("");
    await queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">CMS Pages</h1>
          <p className="text-sm text-muted-foreground">Kelola halaman publik statis berbasis slug.</p>
        </div>
        <Link href="/admin/cms/pages/new" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90">
          Buat Halaman
        </Link>
      </div>

      <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-3">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs text-muted-foreground">Cari</span>
          <input
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Filter status</span>
          <select
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
          >
            <option value="">Semua</option>
            <option value="DRAFT">DRAFT</option>
            <option value="REVIEW">REVIEW</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>
      </div>

      <DataTablePagination
        page={currentPage}
        pageSize={currentPageSize}
        total={total}
        visibleCount={rows.length}
        itemLabel="halaman"
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPageChange={(nextPage) => setPage(Math.max(1, nextPage))}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
        <select className="rounded-md border px-2 py-1.5 text-sm" value={bulkAction} onChange={(event) => setBulkAction(event.target.value as BulkAction)}>
          <option value="">Pilih bulk action...</option>
          <option value="publish">Publish</option>
          <option value="unpublish">Unpublish</option>
          <option value="archive">Archive</option>
        </select>
        <button
          type="button"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
          disabled={!bulkAction || selectedIds.length === 0 || isApplyingBulk}
          onClick={applyBulkAction}
        >
          {isApplyingBulk ? "Memproses..." : `Apply (${selectedIds.length})`}
        </button>
      </div>

      {pagesQuery.isLoading ? (
        <div>Memuat data...</div>
      ) : (
        <DataTable minWidthClassName="min-w-[1160px]">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Pilih semua halaman" />
              </DataTableHeaderCell>
              <DataTableHeaderCell>Judul</DataTableHeaderCell>
              <DataTableHeaderCell>Slug</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell>Publish</DataTableHeaderCell>
              <DataTableHeaderCell>Audit</DataTableHeaderCell>
              <DataTableHeaderCell>Updated</DataTableHeaderCell>
              <DataTableHeaderCell>Aksi</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <tbody>
            {rows.map((item) => (
              <DataTableRow key={item.id}>
                <DataTableCell>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(item.id)}
                    onChange={() => toggleSelected(item.id)}
                    aria-label={`Pilih halaman ${item.title}`}
                  />
                </DataTableCell>
                <DataTableCell className="font-medium">{item.title}</DataTableCell>
                <DataTableCell>/{item.slug}</DataTableCell>
                <DataTableCell>{item.status}</DataTableCell>
                <DataTableCell>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "-"}</DataTableCell>
                <DataTableCell>
                  <div className="space-y-0.5 text-xs">
                    <p className="text-muted-foreground">C: {item.createdBy || "-"}</p>
                    <p className="text-muted-foreground">U: {item.updatedBy || "-"}</p>
                    <p className="text-muted-foreground">P: {item.publishedBy || "-"}</p>
                  </div>
                </DataTableCell>
                <DataTableCell>{new Date(item.updatedAt).toLocaleString()}</DataTableCell>
                <DataTableCell>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/cms/pages/${item.id}/edit`} className="rounded border px-2 py-1 text-xs hover:bg-muted/70">
                      Edit
                    </Link>
                    <Link href={`/p/${item.slug}`} target="_blank" className="rounded border px-2 py-1 text-xs hover:bg-muted/70">
                      View
                    </Link>
                    {item.status === "PUBLISHED" ? (
                      <button type="button" className="rounded border px-2 py-1 text-xs hover:bg-muted/70" onClick={() => unpublishMutation.mutate(item.id)}>
                        Unpublish
                      </button>
                    ) : (
                      <button type="button" className="rounded border px-2 py-1 text-xs hover:bg-muted/70" onClick={() => publishMutation.mutate(item.id)}>
                        Publish
                      </button>
                    )}
                    <button type="button" className="rounded border border-red-500 px-2 py-1 text-xs text-red-600" onClick={() => deleteMutation.mutate(item.id)}>
                      Hapus
                    </button>
                  </div>
                </DataTableCell>
              </DataTableRow>
            ))}
            {rows.length === 0 ? <DataTableEmptyRow message="Belum ada halaman." colSpan={8} /> : null}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
