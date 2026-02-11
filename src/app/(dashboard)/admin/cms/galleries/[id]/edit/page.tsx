"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { MediaPicker } from "@/components/cms/media-picker";

type CmsGalleryDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverMediaId: string | null;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  items: Array<{
    id: string;
    mediaId: string;
    caption: string | null;
    order: number;
    media: {
      id: string;
      filename: string;
      alt: string | null;
      previewPath: string;
      publicPath: string;
    };
  }>;
};

type CmsMediaDetail = {
  id: string;
  filename: string;
  alt: string | null;
  previewPath: string;
  publicPath: string;
};

type GalleryItemForm = {
  localId: string;
  serverId?: string;
  mediaId: string;
  caption: string;
  order: number;
  mediaFilename: string;
  mediaAlt: string | null;
  mediaPreviewPath: string;
  mediaPublicPath: string;
};

export default function AdminCmsEditGalleryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const galleryQuery = useQuery<CmsGalleryDetail>({
    queryKey: ["admin-cms-gallery", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/cms/galleries/${id}`);
      if (!res.ok) throw new Error("Failed to load gallery");
      return (await res.json()) as CmsGalleryDetail;
    },
    enabled: Boolean(id),
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [status, setStatus] = useState<"DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [items, setItems] = useState<GalleryItemForm[]>([]);
  const [selectedItemMediaId, setSelectedItemMediaId] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!galleryQuery.data) return;
    const data = galleryQuery.data;
    setTitle(data.title);
    setSlug(data.slug);
    setDescription(data.description || "");
    setCoverMediaId(data.coverMediaId || null);
    setStatus(data.status);
    setItems(
      data.items.map((item) => ({
        localId: item.id,
        serverId: item.id,
        mediaId: item.mediaId,
        caption: item.caption || "",
        order: item.order,
        mediaFilename: item.media.filename,
        mediaAlt: item.media.alt,
        mediaPreviewPath: item.media.previewPath,
        mediaPublicPath: item.media.publicPath,
      }))
    );
  }, [galleryQuery.data]);

  const nextOrder = useMemo(() => {
    if (items.length === 0) return 1;
    return Math.max(...items.map((item) => item.order)) + 1;
  }, [items]);

  async function fetchMediaDetail(mediaId: string) {
    const res = await fetch(`/api/admin/cms/media/${mediaId}`);
    if (!res.ok) throw new Error("Gagal mengambil detail media");
    return (await res.json()) as CmsMediaDetail;
  }

  async function addSelectedMediaAsItem() {
    if (!selectedItemMediaId) return;

    const exists = items.some((item) => item.mediaId === selectedItemMediaId);
    if (exists) {
      setInfo("Media sudah ada di daftar item galeri.");
      return;
    }

    try {
      const media = await fetchMediaDetail(selectedItemMediaId);
      setItems((current) => [
        ...current,
        {
          localId: crypto.randomUUID(),
          mediaId: media.id,
          caption: "",
          order: current.length === 0 ? 1 : Math.max(...current.map((item) => item.order)) + 1,
          mediaFilename: media.filename,
          mediaAlt: media.alt,
          mediaPreviewPath: media.previewPath,
          mediaPublicPath: media.publicPath,
        },
      ]);
      setInfo("Media berhasil ditambahkan ke item galeri.");
    } catch (err) {
      setInfo(err instanceof Error ? err.message : "Gagal menambahkan media");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    const patchRes = await fetch(`/api/admin/cms/galleries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slug || undefined,
        description: description || undefined,
        coverMediaId,
        status,
      }),
    });

    if (!patchRes.ok) {
      setSubmitting(false);
      const payload = await patchRes.json().catch(() => ({}));
      setError(payload?.error || "Gagal menyimpan data galeri");
      return;
    }

    const itemsRes = await fetch(`/api/admin/cms/galleries/${id}/items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          mediaId: item.mediaId,
          caption: item.caption || undefined,
          order: item.order,
        })),
      }),
    });

    setSubmitting(false);

    if (!itemsRes.ok) {
      const payload = await itemsRes.json().catch(() => ({}));
      setError(payload?.error || "Gagal menyimpan item galeri");
      return;
    }

    setInfo("Galeri berhasil diperbarui.");
    router.refresh();
  }

  if (galleryQuery.isLoading) {
    return <div>Memuat data galeri...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Edit Galeri CMS</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <section className="space-y-3 rounded-lg border p-3 sm:p-4">
          <h2 className="text-sm font-semibold">Info Galeri</h2>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Judul</label>
            <input className="w-full rounded-md border px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Slug</label>
            <input className="w-full rounded-md border px-3 py-2" value={slug} onChange={(event) => setSlug(event.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Deskripsi</label>
            <textarea className="w-full rounded-md border px-3 py-2" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
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
        </section>

        <section className="space-y-3 rounded-lg border p-3 sm:p-4">
          <h2 className="text-sm font-semibold">Cover Galeri</h2>
          <MediaPicker module="galleries" selectedMediaId={coverMediaId} onSelect={setCoverMediaId} />
        </section>

        <section className="space-y-3 rounded-lg border p-3 sm:p-4">
          <h2 className="text-sm font-semibold">Item Galeri</h2>
          <MediaPicker module="galleries" selectedMediaId={selectedItemMediaId} onSelect={setSelectedItemMediaId} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted/70" onClick={addSelectedMediaAsItem}>
              Tambahkan Media Terpilih ke Item Galeri
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted/70"
              onClick={() => setItems((current) => [...current].sort((a, b) => a.order - b.order))}
            >
              Urutkan Sesuai Nilai Order
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item, index) => (
              <article key={item.localId} className="space-y-2 rounded-md border p-2">
                <div className="aspect-video overflow-hidden rounded bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.mediaPreviewPath} alt={item.mediaAlt || item.mediaFilename} className="h-full w-full object-cover" />
                </div>
                <p className="truncate text-xs font-medium" title={item.mediaFilename}>{item.mediaFilename}</p>
                <div>
                  <label className="mb-1 block text-[11px] text-muted-foreground">Caption</label>
                  <input
                    className="w-full rounded border px-2 py-1.5 text-xs"
                    value={item.caption}
                    onChange={(event) => {
                      const value = event.target.value;
                      setItems((current) =>
                        current.map((entry) => (entry.localId === item.localId ? { ...entry, caption: value } : entry))
                      );
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-muted-foreground">Order</label>
                  <input
                    type="number"
                    className="w-20 rounded border px-2 py-1.5 text-xs"
                    value={item.order}
                    min={0}
                    onChange={(event) => {
                      const value = Number(event.target.value || 0);
                      setItems((current) =>
                        current.map((entry) => (entry.localId === item.localId ? { ...entry, order: value } : entry))
                      );
                    }}
                  />
                  <button
                    type="button"
                    className="rounded border border-red-500 px-2 py-1 text-[11px] text-red-600"
                    onClick={() => setItems((current) => current.filter((entry) => entry.localId !== item.localId))}
                  >
                    Hapus
                  </button>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-[11px]"
                    onClick={() => {
                      if (index === 0) return;
                      setItems((current) => {
                        const next = [...current];
                        const prevItem = next[index - 1];
                        next[index - 1] = next[index];
                        next[index] = prevItem;
                        return next.map((entry, idx) => ({ ...entry, order: idx + 1 }));
                      });
                    }}
                  >
                    Naik
                  </button>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-[11px]"
                    onClick={() => {
                      if (index === items.length - 1) return;
                      setItems((current) => {
                        const next = [...current];
                        const nextItem = next[index + 1];
                        next[index + 1] = next[index];
                        next[index] = nextItem;
                        return next.map((entry, idx) => ({ ...entry, order: idx + 1 }));
                      });
                    }}
                  >
                    Turun
                  </button>
                </div>
              </article>
            ))}
            {items.length === 0 ? <p className="text-xs text-muted-foreground">Belum ada item galeri.</p> : null}
          </div>
          <p className="text-xs text-muted-foreground">Total item: {items.length}. Next order default: {nextOrder}</p>
        </section>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {info ? <div className="text-sm text-muted-foreground">{info}</div> : null}

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Galeri"}
          </button>
          <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => router.push("/admin/cms/galleries")}>Kembali</button>
          <a href={`/galeri/${slug}`} target="_blank" className="rounded-md border px-4 py-2 text-sm hover:bg-muted/70" rel="noreferrer">
            Lihat Halaman Publik
          </a>
        </div>
      </form>
    </div>
  );
}
