import type { Metadata } from "next";
import Link from "next/link";
import PublicEmptyState from "@/components/public-empty-state";
import { cmsPublicGalleryListQuerySchema } from "@/server/cms/dto/gallery.dto";
import { listPublishedCmsGalleries } from "@/server/cms/gallery.service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Galeri",
  description: "Galeri kegiatan dan dokumentasi sekolah.",
};

function getSearchParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildGalleryQueryString(params: {
  page?: number;
  pageSize?: number;
  q?: string;
}) {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.pageSize && params.pageSize !== 12) search.set("pageSize", String(params.pageSize));
  if (params.q) search.set("q", params.q);
  return search.toString();
}

export default async function PublicGalleryListPage({ searchParams }: Props) {
  const params = await searchParams;

  const parsed = cmsPublicGalleryListQuerySchema.safeParse({
    page: getSearchParam(params, "page"),
    pageSize: getSearchParam(params, "pageSize") ?? "12",
    q: getSearchParam(params, "q"),
  });

  const query = parsed.success ? parsed.data : { page: 1, pageSize: 12 };
  const result = await listPublishedCmsGalleries(query);
  const hasActiveFilter = Boolean(query.q);

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Portal Publik</p>
        <h1 className="text-3xl font-semibold leading-tight">Galeri Kegiatan</h1>
        <p className="text-sm text-muted-foreground">Dokumentasi kegiatan sekolah yang sudah dipublikasikan.</p>
      </header>

      <form action="/galeri" className="neo-card flex flex-wrap items-end gap-2 p-3">
        <label className="min-w-[220px] flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">Cari galeri</span>
          <input
            type="search"
            name="q"
            defaultValue={query.q || ""}
            placeholder="Cari judul atau deskripsi..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
          Cari
        </button>
        <Link href="/galeri" className="rounded-md border px-3 py-2 text-sm hover:bg-muted/70">
          Reset
        </Link>
      </form>

      {result.items.length === 0 ? (
        <PublicEmptyState
          title={hasActiveFilter ? "Tidak ada galeri yang cocok" : "Belum ada galeri dipublikasikan"}
          description={
            hasActiveFilter
              ? "Coba ubah kata kunci pencarian atau reset filter."
              : "Galeri akan tampil setelah konten dipublikasikan oleh admin."
          }
          actions={[
            { href: "/galeri", label: "Reset Filter", variant: "primary" },
            { href: "/", label: "Kembali ke Beranda" },
          ]}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((gallery) => (
            <article key={gallery.id} className="neo-card overflow-hidden">
              <div className="aspect-video bg-muted/40">
                {gallery.coverMedia?.id ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/public/cms/media/${gallery.coverMedia.id}`}
                    alt={gallery.coverMedia.alt || gallery.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">Tanpa cover</div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <h2 className="line-clamp-2 text-lg font-semibold leading-tight">{gallery.title}</h2>
                {gallery.description ? <p className="line-clamp-3 text-sm text-muted-foreground">{gallery.description}</p> : null}
                <p className="text-xs text-muted-foreground">{gallery.items.length} item</p>
                <Link href={`/galeri/${gallery.slug}`} className="inline-flex rounded border px-3 py-1.5 text-sm hover:bg-muted/70">
                  Lihat galeri
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="text-muted-foreground">Menampilkan {result.items.length} dari total {result.total} galeri.</div>
        <div className="flex items-center gap-2">
          {query.page > 1 ? (
            <Link
              href={`/galeri?${buildGalleryQueryString({
                page: query.page - 1,
                pageSize: query.pageSize,
                q: query.q,
              })}`}
              className="rounded border px-3 py-1.5 hover:bg-muted/70"
            >
              Sebelumnya
            </Link>
          ) : null}
          {query.page * query.pageSize < result.total ? (
            <Link
              href={`/galeri?${buildGalleryQueryString({
                page: query.page + 1,
                pageSize: query.pageSize,
                q: query.q,
              })}`}
              className="rounded border px-3 py-1.5 hover:bg-muted/70"
            >
              Berikutnya
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
