import Link from "next/link";
import type { Metadata } from "next";
import PublicEmptyState from "@/components/public-empty-state";
import { cmsPublicPostListQuerySchema } from "@/server/cms/dto/post.dto";
import { listPublishedCmsPosts } from "@/server/cms/post.service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Pengumuman",
  description: "Daftar pengumuman resmi sekolah.",
  alternates: {
    canonical: "/pengumuman",
  },
};

function getSearchParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildQueryString(params: { page?: number; pageSize?: number; q?: string }) {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.pageSize && params.pageSize !== 10) search.set("pageSize", String(params.pageSize));
  if (params.q) search.set("q", params.q);
  return search.toString();
}

export default async function PublicAnnouncementPage({ searchParams }: Props) {
  const params = await searchParams;

  const parsed = cmsPublicPostListQuerySchema.safeParse({
    page: getSearchParam(params, "page"),
    pageSize: getSearchParam(params, "pageSize") ?? "10",
    q: getSearchParam(params, "q"),
    type: "ANNOUNCEMENT",
  });

  const query = parsed.success
    ? parsed.data
    : {
        page: 1,
        pageSize: 10,
        type: "ANNOUNCEMENT" as const,
      };

  const result = await listPublishedCmsPosts(query);

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Portal Publik</p>
        <h1 className="text-3xl font-semibold leading-tight">Pengumuman Sekolah</h1>
        <p className="text-sm text-muted-foreground">Informasi resmi sekolah yang dipublikasikan oleh admin.</p>
      </header>

      <form action="/pengumuman" className="neo-card flex flex-wrap items-end gap-2 p-3">
        <label className="min-w-[220px] flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">Cari pengumuman</span>
          <input
            type="search"
            name="q"
            defaultValue={query.q || ""}
            placeholder="Cari judul atau ringkasan..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
          Cari
        </button>
        <Link href="/pengumuman" className="rounded-md border px-3 py-2 text-sm hover:bg-muted/70">
          Reset
        </Link>
      </form>

      {result.items.length === 0 ? (
        <PublicEmptyState
          title="Belum ada pengumuman"
          description="Pengumuman akan tampil di sini setelah dipublikasikan oleh admin."
          actions={[
            { href: "/pengumuman", label: "Muat Ulang", variant: "primary" },
            { href: "/", label: "Kembali ke Beranda" },
          ]}
        />
      ) : (
        <div className="grid gap-4">
          {result.items.map((item) => (
            <article key={item.id} className="neo-card space-y-2 p-5">
              <div className="text-xs text-muted-foreground">
                {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "Terjadwal"}
              </div>
              <h2 className="text-xl font-semibold leading-tight">{item.title}</h2>
              {item.excerpt ? <p className="text-sm text-muted-foreground">{item.excerpt}</p> : null}
              <Link href={`/berita/${item.slug}`} className="inline-flex rounded border px-3 py-1.5 text-sm hover:bg-muted/70">
                Lihat detail
              </Link>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="text-muted-foreground">
          Menampilkan {result.items.length} dari total {result.total} pengumuman.
        </div>
        <div className="flex items-center gap-2">
          {query.page > 1 ? (
            <Link href={`/pengumuman?${buildQueryString({ page: query.page - 1, pageSize: query.pageSize, q: query.q })}`} className="rounded border px-3 py-1.5 hover:bg-muted/70">
              Sebelumnya
            </Link>
          ) : null}
          {query.page * query.pageSize < result.total ? (
            <Link href={`/pengumuman?${buildQueryString({ page: query.page + 1, pageSize: query.pageSize, q: query.q })}`} className="rounded border px-3 py-1.5 hover:bg-muted/70">
              Berikutnya
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
