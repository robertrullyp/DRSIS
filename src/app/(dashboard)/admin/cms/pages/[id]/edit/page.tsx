"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type CmsPageItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  template: "DEFAULT" | "PROFILE" | "CONTACT" | "LANDING";
  blocks: unknown;
  content: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
};

export default function AdminCmsEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const pageQuery = useQuery<CmsPageItem>({
    queryKey: ["admin-cms-page", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/cms/pages/${id}`);
      if (!res.ok) throw new Error("Failed to load page");
      return (await res.json()) as CmsPageItem;
    },
    enabled: Boolean(id),
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [template, setTemplate] = useState<"DEFAULT" | "PROFILE" | "CONTACT" | "LANDING">("DEFAULT");
  const [blocksJson, setBlocksJson] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageQuery.data) return;
    setTitle(pageQuery.data.title);
    setSlug(pageQuery.data.slug);
    setExcerpt(pageQuery.data.excerpt || "");
    setTemplate(pageQuery.data.template);
    setBlocksJson(pageQuery.data.blocks ? JSON.stringify(pageQuery.data.blocks, null, 2) : "");
    setContent(pageQuery.data.content);
    setStatus(pageQuery.data.status);
  }, [pageQuery.data]);

  function parseBlocks() {
    if (!blocksJson.trim()) return undefined;
    try {
      const parsed = JSON.parse(blocksJson);
      if (!Array.isArray(parsed)) {
        setError("Blocks harus berupa array JSON.");
        return null;
      }
      return parsed;
    } catch {
      setError("Blocks JSON tidak valid.");
      return null;
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const blocks = parseBlocks();
    if (blocks === null) {
      setSubmitting(false);
      return;
    }

    const res = await fetch(`/api/admin/cms/pages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slug || undefined,
        excerpt: excerpt || undefined,
        template,
        blocks,
        content,
        status,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Gagal menyimpan halaman");
      return;
    }

    router.push("/admin/cms/pages");
    router.refresh();
  }

  if (pageQuery.isLoading) {
    return <div>Memuat data halaman...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Edit Halaman CMS</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Judul</label>
          <input className="w-full rounded-md border px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Slug</label>
          <input className="w-full rounded-md border px-3 py-2" value={slug} onChange={(event) => setSlug(event.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Excerpt</label>
          <textarea className="w-full rounded-md border px-3 py-2" rows={2} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Template</label>
          <select className="w-full rounded-md border px-3 py-2" value={template} onChange={(event) => setTemplate(event.target.value as typeof template)}>
            <option value="DEFAULT">DEFAULT</option>
            <option value="PROFILE">PROFILE</option>
            <option value="CONTACT">CONTACT</option>
            <option value="LANDING">LANDING</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Blocks JSON (opsional)</label>
          <textarea
            className="w-full rounded-md border px-3 py-2 font-mono text-xs"
            rows={5}
            value={blocksJson}
            onChange={(event) => setBlocksJson(event.target.value)}
            placeholder='[{"type":"hero","title":"Profil Sekolah","body":"..."}]'
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Konten (Markdown)</label>
          <p className="mb-1 text-[11px] text-muted-foreground">Dukung heading, list, link, tabel, dan gambar markdown.</p>
          <textarea className="w-full rounded-md border px-3 py-2" rows={12} value={content} onChange={(event) => setContent(event.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Status</label>
          <select className="w-full rounded-md border px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="DRAFT">DRAFT</option>
            <option value="REVIEW">REVIEW</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
          <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => router.push("/admin/cms/pages")}>
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
