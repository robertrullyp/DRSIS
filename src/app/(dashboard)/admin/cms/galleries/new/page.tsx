"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { MediaPicker } from "@/components/cms/media-picker";

type CreateGalleryResponse = { id: string };

export default function AdminCmsNewGalleryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [status, setStatus] = useState<"DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/cms/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slug || undefined,
        description: description || undefined,
        coverMediaId: coverMediaId || undefined,
        status,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Gagal membuat galeri");
      return;
    }

    const created = (await res.json()) as CreateGalleryResponse;
    router.push(`/admin/cms/galleries/${created.id}/edit`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Buat Galeri CMS</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Judul</label>
          <input className="w-full rounded-md border px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Slug (opsional)</label>
          <input className="w-full rounded-md border px-3 py-2" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="contoh: kegiatan-sekolah-2026" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Deskripsi</label>
          <textarea className="w-full rounded-md border px-3 py-2" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>

        <MediaPicker module="galleries" selectedMediaId={coverMediaId} onSelect={setCoverMediaId} />

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Status awal</label>
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
            {isSubmitting ? "Menyimpan..." : "Simpan & Lanjut Kelola Item"}
          </button>
          <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => router.push("/admin/cms/galleries")}>
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
