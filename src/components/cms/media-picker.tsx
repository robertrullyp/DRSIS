"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type CmsMediaItem = {
  id: string;
  key: string;
  filename: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  title: string | null;
  module: string | null;
  previewPath: string;
  publicPath: string;
};

type CmsMediaListResponse = {
  items: CmsMediaItem[];
  total: number;
  page: number;
  pageSize: number;
};

type Props = {
  module: "posts" | "galleries" | "pages" | "events";
  selectedMediaId: string | null;
  onSelect: (id: string | null) => void;
  onInsertInline?: (snippet: string) => void;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

async function detectImageDimensions(file: File) {
  if (!file.type.startsWith("image/")) {
    return { width: undefined, height: undefined };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const size = await new Promise<{ width?: number; height?: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: undefined, height: undefined });
      img.src = objectUrl;
    });

    return size;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function MediaPicker({ module, selectedMediaId, onSelect, onInsertInline }: Props) {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: "1", pageSize: "30", module });
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [q, module]);

  const mediaQuery = useQuery<CmsMediaListResponse>({
    queryKey: ["admin-cms-media", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/cms/media?${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch media");
      return (await res.json()) as CmsMediaListResponse;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setError(null);
      const presignRes = await fetch("/api/admin/cms/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, module }),
      });

      if (!presignRes.ok) {
        throw new Error("Gagal membuat URL upload");
      }

      const presign = (await presignRes.json()) as { key: string; url: string };

      const uploadRes = await fetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload file ke storage gagal");
      }

      const { width, height } = await detectImageDimensions(file);

      const createRes = await fetch("/api/admin/cms/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: presign.key,
          filename: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
          width,
          height,
          module,
          title: file.name,
          alt: file.name,
        }),
      });

      if (!createRes.ok) {
        throw new Error("Gagal menyimpan metadata media");
      }

      return (await createRes.json()) as CmsMediaItem;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cms-media"] });
      onSelect(created.id);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Gagal upload media");
    },
  });

  const selected = mediaQuery.data?.items.find((item) => item.id === selectedMediaId) || null;

  return (
    <section className="space-y-3 rounded-lg border p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Media Library</h3>
          <p className="text-xs text-muted-foreground">Upload atau pilih gambar untuk cover/inline post.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/70">
          {uploadMutation.isPending ? "Mengunggah..." : "Upload media"}
          <input
            type="file"
            className="hidden"
            disabled={uploadMutation.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              uploadMutation.mutate(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm sm:max-w-xs"
          placeholder="Cari filename/title/key..."
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <button
          type="button"
          className="rounded-md border px-2.5 py-2 text-xs hover:bg-muted/70"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-cms-media"] })}
        >
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {selected ? (
        <div className="rounded-md border border-emerald-500/50 bg-emerald-500/5 p-3 text-xs">
          <p className="font-medium">Cover terpilih: {selected.filename}</p>
          <p className="text-muted-foreground">URL publik: {selected.publicPath}</p>
          <button type="button" className="mt-2 rounded border px-2 py-1 hover:bg-muted/70" onClick={() => onSelect(null)}>
            Hapus pilihan cover
          </button>
        </div>
      ) : null}

      {mediaQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat media...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(mediaQuery.data?.items ?? []).map((item) => (
            <article key={item.id} className={`rounded-md border p-2 ${item.id === selectedMediaId ? "border-accent" : ""}`}>
              <div className="mb-2 aspect-video overflow-hidden rounded bg-muted">
                {item.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.previewPath} alt={item.alt || item.filename} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">Non-image</div>
                )}
              </div>
              <p className="truncate text-xs font-medium" title={item.filename}>
                {item.filename}
              </p>
              <p className="text-[11px] text-muted-foreground">{formatBytes(item.size)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button type="button" className="rounded border px-2 py-1 text-[11px] hover:bg-muted/70" onClick={() => onSelect(item.id)}>
                  Pilih Cover
                </button>
                {onInsertInline ? (
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-[11px] hover:bg-muted/70"
                    onClick={() => onInsertInline(`![${item.alt || item.filename}](${item.publicPath})`)}
                  >
                    Insert Inline
                  </button>
                ) : null}
              </div>
            </article>
          ))}
          {(mediaQuery.data?.items.length ?? 0) === 0 ? (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">Belum ada media untuk modul ini.</div>
          ) : null}
        </div>
      )}
    </section>
  );
}
