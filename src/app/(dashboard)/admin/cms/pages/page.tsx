"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type CmsPageItem = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  updatedAt: string;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("");
  const [isApplyingBulk, setApplyingBulk] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: "1", pageSize: "100" });
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [status, q]);

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
          <input className="w-full rounded-md border px-2 py-1.5 text-sm" value={q} onChange={(event) => setQ(event.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Filter status</span>
          <select className="w-full rounded-md border px-2 py-1.5 text-sm" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="">Semua</option>
            <option value="DRAFT">DRAFT</option>
            <option value="REVIEW">REVIEW</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>
      </div>

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
        <div className="overflow-auto">
          <table className="w-full min-w-[980px] border text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b p-2 text-left">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Pilih semua halaman" />
                </th>
                <th className="border-b p-2 text-left">Judul</th>
                <th className="border-b p-2 text-left">Slug</th>
                <th className="border-b p-2 text-left">Status</th>
                <th className="border-b p-2 text-left">Publish</th>
                <th className="border-b p-2 text-left">Updated</th>
                <th className="border-b p-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td className="border-b p-2">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(item.id)}
                      onChange={() => toggleSelected(item.id)}
                      aria-label={`Pilih halaman ${item.title}`}
                    />
                  </td>
                  <td className="border-b p-2 font-medium">{item.title}</td>
                  <td className="border-b p-2">/{item.slug}</td>
                  <td className="border-b p-2">{item.status}</td>
                  <td className="border-b p-2">{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "-"}</td>
                  <td className="border-b p-2">{new Date(item.updatedAt).toLocaleString()}</td>
                  <td className="border-b p-2">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/cms/pages/${item.id}/edit`} className="rounded border px-2 py-1 text-xs hover:bg-muted/70">
                        Edit
                      </Link>
                      <Link href={`/p/${item.slug}`} target="_blank" className="rounded border px-2 py-1 text-xs hover:bg-muted/70">
                        View
                      </Link>
                      {item.status === "PUBLISHED" ? (
                        <button
                          type="button"
                          className="rounded border px-2 py-1 text-xs hover:bg-muted/70"
                          onClick={() => unpublishMutation.mutate(item.id)}
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded border px-2 py-1 text-xs hover:bg-muted/70"
                          onClick={() => publishMutation.mutate(item.id)}
                        >
                          Publish
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded border border-red-500 px-2 py-1 text-xs text-red-600"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={7}>
                    Belum ada halaman.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
