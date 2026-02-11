"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { MediaPicker } from "@/components/cms/media-picker";

export default function AdminCmsNewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [type, setType] = useState<"NEWS" | "ARTICLE" | "ANNOUNCEMENT">("NEWS");
  const [status, setStatus] = useState<"DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/cms/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slug || undefined,
        excerpt: excerpt || undefined,
        content,
        type,
        status,
        coverMediaId: coverMediaId || undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Gagal membuat post");
      return;
    }

    router.push("/admin/cms/posts");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Buat Post CMS</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Judul</label>
          <input className="w-full rounded-md border px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Slug (opsional, auto-generate jika kosong)</label>
          <input className="w-full rounded-md border px-3 py-2" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="contoh: pengumuman-semester-baru" />
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
            <label className="mb-1 block text-xs text-muted-foreground">Status awal</label>
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
          <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => router.push("/admin/cms/posts")}>
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
