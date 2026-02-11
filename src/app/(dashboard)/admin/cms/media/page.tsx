"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MediaPicker } from "@/components/cms/media-picker";

type CmsMediaDetail = {
  id: string;
  filename: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  title: string | null;
  key: string;
  previewPath: string;
  publicPath: string;
};

export default function AdminCmsMediaPage() {
  const queryClient = useQueryClient();
  const [module, setModule] = useState<"posts" | "galleries" | "pages">("posts");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const detailQuery = useQuery<CmsMediaDetail>({
    queryKey: ["admin-cms-media-detail", selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/cms/media/${selectedId}`);
      if (!res.ok) throw new Error("Failed to fetch media detail");
      return (await res.json()) as CmsMediaDetail;
    },
    enabled: Boolean(selectedId),
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    setAlt(detailQuery.data.alt || "");
    setTitle(detailQuery.data.title || "");
  }, [detailQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) return;
      const res = await fetch(`/api/admin/cms/media/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: alt || null, title: title || null }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui metadata media");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cms-media"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cms-media-detail", selectedId] });
      setMessage("Metadata media berhasil disimpan.");
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Gagal memperbarui media");
    },
  });

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">CMS Media Library</h1>
        <p className="text-sm text-muted-foreground">Kelola media untuk posts, pages, dan galleries berbasis S3/MinIO.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-xs">
        <span className="text-muted-foreground">Modul:</span>
        {(["posts", "galleries", "pages"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`rounded border px-2.5 py-1 ${module === item ? "border-accent bg-accent/10" : ""}`}
            onClick={() => {
              setModule(item);
              setSelectedId(null);
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <MediaPicker module={module} selectedMediaId={selectedId} onSelect={setSelectedId} />

      {selectedId && detailQuery.data ? (
        <section className="space-y-3 rounded-lg border p-3 sm:p-4">
          <h2 className="text-sm font-semibold">Metadata Media Terpilih</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Title</label>
              <input className="w-full rounded-md border px-3 py-2 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Alt Text</label>
              <input className="w-full rounded-md border px-3 py-2 text-sm" value={alt} onChange={(event) => setAlt(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <p>Filename: {detailQuery.data.filename}</p>
            <p>MIME: {detailQuery.data.mime}</p>
            <p>Ukuran: {detailQuery.data.size} bytes</p>
            <p>
              Dimensi: {detailQuery.data.width && detailQuery.data.height ? `${detailQuery.data.width}x${detailQuery.data.height}` : "-"}
            </p>
            <p className="sm:col-span-2">Key: {detailQuery.data.key}</p>
            <p className="sm:col-span-2">URL publik image: {detailQuery.data.publicPath}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Menyimpan..." : "Simpan Metadata"}
            </button>
            {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
