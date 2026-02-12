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

type CmsPostItem = {
  id: string;
  title: string;
  slug: string;
  type: "NEWS" | "ARTICLE" | "ANNOUNCEMENT";
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  excerpt: string | null;
  publishedAt: string | null;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  publishedBy: string | null;
};

type CmsPostResponse = {
  items: CmsPostItem[];
  total: number;
  page: number;
  pageSize: number;
};

type BulkAction = "" | "publish" | "unpublish" | "archive";

export default function AdminCmsPostsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"" | "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED">("");
  const [type, setType] = useState<"" | "NEWS" | "ARTICLE" | "ANNOUNCEMENT">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("");
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isApplyingBulk, setApplyingBulk] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [page, pageSize, status, type, q]);

  const postsQuery = useQuery<CmsPostResponse>({
    queryKey: ["admin-cms-posts", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/cms/posts?${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return (await res.json()) as CmsPostResponse;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/cms/posts/${id}/publish`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to publish");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cms-posts"] }),
  });

  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/cms/posts/${id}/unpublish`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to unpublish");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cms-posts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/cms/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cms-posts"] }),
  });

  const rows = postsQuery.data?.items ?? [];
  const total = postsQuery.data?.total ?? 0;
  const currentPage = postsQuery.data?.page ?? page;
  const currentPageSize = postsQuery.data?.pageSize ?? pageSize;
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
    setBulkMessage(null);
    setBulkError(null);

    const results = await Promise.allSettled(
      selectedIds.map(async (id) => {
        if (bulkAction === "publish") {
          const res = await fetch(`/api/admin/cms/posts/${id}/publish`, { method: "POST" });
          if (!res.ok) throw new Error("publish");
          return;
        }
        if (bulkAction === "unpublish") {
          const res = await fetch(`/api/admin/cms/posts/${id}/unpublish`, { method: "POST" });
          if (!res.ok) throw new Error("unpublish");
          return;
        }
        const res = await fetch(`/api/admin/cms/posts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ARCHIVED" }),
        });
        if (!res.ok) throw new Error("archive");
      })
    );

    const successCount = results.filter((result) => result.status === "fulfilled").length;
    const failCount = results.length - successCount;
    setApplyingBulk(false);

    if (successCount > 0) {
      setBulkMessage(`Bulk action berhasil pada ${successCount} post.`);
    }
    if (failCount > 0) {
      setBulkError(`${failCount} post gagal diproses.`);
    }

    await queryClient.invalidateQueries({ queryKey: ["admin-cms-posts"] });
    setSelectedIds([]);
    setBulkAction("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">CMS Posts</h1>
          <p className="text-sm text-muted-foreground">Kelola berita dan artikel publik.</p>
        </div>
        <Link href="/admin/cms/posts/new" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90">
          Buat Post
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
            placeholder="Judul, slug, excerpt..."
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Status</span>
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
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Tipe</span>
          <select
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            value={type}
            onChange={(event) => {
              setType(event.target.value as typeof type);
              setPage(1);
            }}
          >
            <option value="">Semua</option>
            <option value="NEWS">NEWS</option>
            <option value="ARTICLE">ARTICLE</option>
            <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
          </select>
        </label>
        <button
          type="button"
          className="self-end rounded-md border px-3 py-2 text-sm hover:bg-muted/70"
          onClick={() => {
            setQ("");
            setStatus("");
            setType("");
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
        itemLabel="post"
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPageChange={(nextPage) => setPage(Math.max(1, nextPage))}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
        <select
          className="rounded-md border px-2 py-1.5 text-sm"
          value={bulkAction}
          onChange={(event) => setBulkAction(event.target.value as BulkAction)}
          disabled={selectedIds.length === 0 || isApplyingBulk}
        >
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
        <span className="text-xs text-muted-foreground">Terpilih: {selectedIds.length}</span>
      </div>

      {bulkMessage ? <p className="text-sm text-green-700">{bulkMessage}</p> : null}
      {bulkError ? <p className="text-sm text-red-600">{bulkError}</p> : null}

      {postsQuery.isLoading ? (
        <div>Memuat data...</div>
      ) : (
        <DataTable minWidthClassName="min-w-[1220px]">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Pilih semua post" />
              </DataTableHeaderCell>
              <DataTableHeaderCell>Judul</DataTableHeaderCell>
              <DataTableHeaderCell>Slug</DataTableHeaderCell>
              <DataTableHeaderCell>Tipe</DataTableHeaderCell>
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
                    aria-label={`Pilih post ${item.title}`}
                  />
                </DataTableCell>
                <DataTableCell className="font-medium">{item.title}</DataTableCell>
                <DataTableCell>/{item.slug}</DataTableCell>
                <DataTableCell>{item.type}</DataTableCell>
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
                    <Link href={`/admin/cms/posts/${item.id}/edit`} className="rounded border px-2 py-1 text-xs hover:bg-muted/70">
                      Edit
                    </Link>
                    <Link href={`/berita/${item.slug}`} target="_blank" className="rounded border px-2 py-1 text-xs hover:bg-muted/70">
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
            {rows.length === 0 ? <DataTableEmptyRow message="Belum ada post." colSpan={9} /> : null}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
