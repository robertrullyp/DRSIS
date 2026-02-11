"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { MediaPicker } from "@/components/cms/media-picker";

type CmsPostItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  type: "NEWS" | "ARTICLE" | "ANNOUNCEMENT";
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  coverMediaId: string | null;
};

export default function AdminCmsEditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const postQuery = useQuery<CmsPostItem>({
    queryKey: ["admin-cms-post", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/cms/posts/${id}`);
      if (!res.ok) throw new Error("Failed to load post");
      return (await res.json()) as CmsPostItem;
    },
    enabled: Boolean(id),
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [type, setType] = useState<"NEWS" | "ARTICLE" | "ANNOUNCEMENT">("NEWS");
  const [status, setStatus] = useState<"DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [isSubmitting, setSubmitting] = useState(false);
  const [isPreviewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postQuery.data) return;
    setTitle(postQuery.data.title);
    setSlug(postQuery.data.slug);
    setExcerpt(postQuery.data.excerpt || "");
    setContent(postQuery.data.content);
    setType(postQuery.data.type);
    setStatus(postQuery.data.status);
    setCoverMediaId(postQuery.data.coverMediaId || null);
  }, [postQuery.data]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/admin/cms/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slug || undefined,
        excerpt: excerpt || undefined,
        content,
        type,
        status,
        coverMediaId,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Gagal menyimpan post");
      return;
    }

    router.push("/admin/cms/posts");
    router.refresh();
  }

  async function onPreview() {
    setPreviewing(true);
    setError(null);

    const res = await fetch(`/api/admin/cms/posts/${id}/preview`);
    const payload = await res.json().catch(() => ({}));

    setPreviewing(false);

    if (!res.ok || !payload?.url) {
      setError(payload?.error || "Gagal membuat link preview");
      return;
    }

    window.open(payload.url as string, "_blank", "noopener,noreferrer");
  }

  if (postQuery.isLoading) {
    return <div>Memuat data post...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Edit Post CMS</h1>
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
          <label className="mb-1 block text-xs text-muted-foreground">Konten (Markdown)</label>
          <p className="mb-1 text-[11px] text-muted-foreground">Dukung heading, list, link, tabel, dan gambar markdown.</p>
          <textarea className="w-full rounded-md border px-3 py-2" rows={12} value={content} onChange={(event) => setContent(event.target.value)} required />
        </div>
        <MediaPicker
          module="posts"
          selectedMediaId={coverMediaId}
          onSelect={setCoverMediaId}
          onInsertInline={(snippet) => setContent((current) => `${current}${current ? "\n\n" : ""}${snippet}`)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Tipe</label>
            <select className="w-full rounded-md border px-3 py-2" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
              <option value="NEWS">NEWS</option>
              <option value="ARTICLE">ARTICLE</option>
              <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
            </select>
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
        </div>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
          <button type="button" className="rounded-md border px-4 py-2 text-sm" disabled={isPreviewing} onClick={onPreview}>
            {isPreviewing ? "Menyiapkan preview..." : "Preview Draft"}
          </button>
          <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => router.push("/admin/cms/posts")}>
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
