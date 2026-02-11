"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { MediaPicker } from "@/components/cms/media-picker";

function toLocalDateTimeInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminCmsNewEventPage() {
  const router = useRouter();
  const defaultStart = useMemo(() => toLocalDateTimeInputValue(new Date()), []);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState(defaultStart);
  const [endAt, setEndAt] = useState("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [status, setStatus] = useState<"DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/cms/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slug || undefined,
        description: description || undefined,
        location: location || undefined,
        startAt,
        endAt: endAt || undefined,
        coverMediaId: coverMediaId || undefined,
        status,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Gagal membuat event");
      return;
    }

    router.push("/admin/cms/events");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Buat Event CMS</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Judul</label>
          <input className="w-full rounded-md border px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Slug (opsional, auto-generate jika kosong)</label>
          <input className="w-full rounded-md border px-3 py-2" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="contoh: workshop-guru-februari" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Lokasi</label>
          <input className="w-full rounded-md border px-3 py-2" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Aula Sekolah" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Mulai</label>
            <input type="datetime-local" className="w-full rounded-md border px-3 py-2" value={startAt} onChange={(event) => setStartAt(event.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Selesai (opsional)</label>
            <input type="datetime-local" className="w-full rounded-md border px-3 py-2" value={endAt} onChange={(event) => setEndAt(event.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Deskripsi</label>
          <textarea className="w-full rounded-md border px-3 py-2" rows={8} value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>

        <MediaPicker module="events" selectedMediaId={coverMediaId} onSelect={setCoverMediaId} />

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
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
          <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => router.push("/admin/cms/events")}>
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
