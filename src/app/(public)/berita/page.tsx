import Link from "next/link";
import type { Metadata } from "next";
import PublicEmptyState from "@/components/public-empty-state";
import { cmsPublicPostListQuerySchema } from "@/server/cms/dto/post.dto";
import { listPublishedCmsPosts, listPublishedCmsPostTaxonomy } from "@/server/cms/post.service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Berita",
  description: "Berita dan artikel terbaru sekolah.",
};

function getSearchParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildNewsQueryString(params: {
  page?: number;
  pageSize?: number;
  q?: string;
  type?: "NEWS" | "ARTICLE" | "ANNOUNCEMENT";
  category?: string;
  tag?: string;
}) {
  const search = new URLSearchParams();

  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.pageSize && params.pageSize !== 10) search.set("pageSize", String(params.pageSize));
  if (params.q) search.set("q", params.q);
  if (params.type) search.set("type", params.type);
  if (params.category) search.set("category", params.category);
  if (params.tag) search.set("tag", params.tag);

  return search.toString();
}

export default async function PublicNewsPage({ searchParams }: Props) {
  const params = await searchParams;

  const parsed = cmsPublicPostListQuerySchema.safeParse({
    page: getSearchParam(params, "page"),
    pageSize: getSearchParam(params, "pageSize") ?? "10",
    q: getSearchParam(params, "q"),
    type: getSearchParam(params, "type"),
    category: getSearchParam(params, "category"),
    tag: getSearchParam(params, "tag"),
  });

  const query = parsed.success
    ? parsed.data
    : {
        page: 1,
        pageSize: 10,
      };

  const [result, taxonomy] = await Promise.all([listPublishedCmsPosts(query), listPublishedCmsPostTaxonomy()]);
  const hasActiveFilter = Boolean(query.q || query.type || query.category || query.tag);

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Portal Publik</p>
        <h1 className="text-3xl font-semibold leading-tight">Berita & Artikel</h1>
        <p className="text-sm text-muted-foreground">Informasi terbaru, pengumuman, dan artikel dari sekolah.</p>
      </header>

      <form action="/berita" className="neo-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="space-y-1 lg:col-span-2">
          <span className="text-xs text-muted-foreground">Cari</span>
          <input
            type="search"
            name="q"
            defaultValue={query.q || ""}
            placeholder="Cari judul atau ringkasan..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Tipe</span>
          <select name="type" defaultValue={query.type || ""} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="">Semua</option>
            <option value="NEWS">NEWS</option>
            <option value="ARTICLE">ARTICLE</option>
            <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Kategori</span>
          <select name="category" defaultValue={query.category || ""} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="">Semua</option>
            {taxonomy.categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Tag</span>
          <select name="tag" defaultValue={query.tag || ""} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="">Semua</option>
            {taxonomy.tags.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2 lg:col-span-5">
          <button type="submit" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
            Terapkan Filter
          </button>
          <Link href="/berita" className="rounded-md border px-3 py-2 text-sm hover:bg-muted/70">
            Reset
          </Link>
        </div>
      </form>

      {result.items.length === 0 ? (
        <PublicEmptyState
          title={hasActiveFilter ? "Tidak ada hasil yang cocok" : "Belum ada berita yang dipublikasikan"}
          description={
            hasActiveFilter
              ? "Coba ganti kata kunci atau hapus sebagian filter untuk melihat konten lain."
              : "Konten berita akan muncul setelah dipublikasikan oleh admin."
          }
          actions={[
            { href: "/berita", label: "Reset Filter", variant: "primary" },
            { href: "/", label: "Kembali ke Beranda" },
          ]}
        />
      ) : (
        <div className="grid gap-4">
          {result.items.map((post) => (
            <article key={post.id} className="neo-card space-y-3 p-5 sm:p-6">
              {post.coverMedia?.id ? (
                <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/public/cms/media/${post.coverMedia.id}`}
                    alt={post.coverMedia.alt || post.title}
                    className="h-48 w-full object-cover sm:h-56"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded border px-2 py-0.5">{post.type}</span>
                <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Belum dijadwalkan"}</span>
              </div>
              <h2 className="text-xl font-semibold leading-tight">{post.title}</h2>
              {post.excerpt ? <p className="text-sm text-muted-foreground">{post.excerpt}</p> : null}
              <Link href={`/berita/${post.slug}`} className="inline-flex rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted/70">
                Baca selengkapnya
              </Link>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="text-muted-foreground">
          Menampilkan {result.items.length} dari total {result.total} konten.
        </div>
        <div className="flex items-center gap-2">
          {query.page > 1 ? (
            <Link
              href={`/berita?${buildNewsQueryString({
                page: query.page - 1,
                pageSize: query.pageSize,
                q: query.q,
                type: query.type,
                category: query.category,
                tag: query.tag,
              })}`}
              className="rounded border px-3 py-1.5 hover:bg-muted/70"
            >
              Sebelumnya
            </Link>
          ) : null}
          {query.page * query.pageSize < result.total ? (
            <Link
              href={`/berita?${buildNewsQueryString({
                page: query.page + 1,
                pageSize: query.pageSize,
                q: query.q,
                type: query.type,
                category: query.category,
                tag: query.tag,
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
