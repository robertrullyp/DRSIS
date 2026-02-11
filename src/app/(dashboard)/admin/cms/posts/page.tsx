"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type CmsPostItem = {
  id: string;
  title: string;
  slug: string;
  type: "NEWS" | "ARTICLE" | "ANNOUNCEMENT";
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  excerpt: string | null;
  publishedAt: string | null;
  updatedAt: string;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("");
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isApplyingBulk, setApplyingBulk] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: "1", pageSize: "100" });
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [status, type, q]);

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
            onChange={(event) => setQ(event.target.value)}
            placeholder="Judul, slug, excerpt..."
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Status</span>
          <select className="w-full rounded-md border px-2 py-1.5 text-sm" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="">Semua</option>
            <option value="DRAFT">DRAFT</option>
            <option value="REVIEW">REVIEW</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Tipe</span>
          <select className="w-full rounded-md border px-2 py-1.5 text-sm" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
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
          }}
        >
          Reset
        </button>
      </div>

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
        <div className="overflow-auto">
          <table className="w-full min-w-[1040px] border text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b p-2 text-left">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Pilih semua post" />
                </th>
                <th className="border-b p-2 text-left">Judul</th>
                <th className="border-b p-2 text-left">Slug</th>
                <th className="border-b p-2 text-left">Tipe</th>
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
                      aria-label={`Pilih post ${item.title}`}
                    />
                  </td>
                  <td className="border-b p-2 font-medium">{item.title}</td>
                  <td className="border-b p-2">/{item.slug}</td>
                  <td className="border-b p-2">{item.type}</td>
                  <td className="border-b p-2">{item.status}</td>
                  <td className="border-b p-2">{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "-"}</td>
                  <td className="border-b p-2">{new Date(item.updatedAt).toLocaleString()}</td>
                  <td className="border-b p-2">
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
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={8}>
                    Belum ada post.
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
