import Link from "next/link";
import type { Metadata } from "next";
import PublicEmptyState from "@/components/public-empty-state";
import { cmsPublicEventListQuerySchema } from "@/server/cms/dto/event.dto";
import { listPublishedCmsEvents } from "@/server/cms/event.service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Agenda",
  description: "Agenda kegiatan dan event sekolah.",
};

function getSearchParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatDateTime(value: Date | string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function buildAgendaQueryString(params: {
  tab?: "all" | "upcoming" | "past";
  page?: number;
  q?: string;
}) {
  const search = new URLSearchParams();
  if (params.tab) search.set("tab", params.tab);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.q) search.set("q", params.q);
  return search.toString();
}

export default async function PublicAgendaPage({ searchParams }: Props) {
  const params = await searchParams;

  const parsed = cmsPublicEventListQuerySchema.safeParse({
    page: getSearchParam(params, "page"),
    pageSize: getSearchParam(params, "pageSize") ?? "10",
    q: getSearchParam(params, "q"),
    tab: getSearchParam(params, "tab") ?? "upcoming",
  });

  const query = parsed.success
    ? parsed.data
    : {
        page: 1,
        pageSize: 10,
        tab: "upcoming" as const,
      };

  const result = await listPublishedCmsEvents(query);
  const tab = query.tab;
  const hasActiveFilter = Boolean(query.q);

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Portal Publik</p>
        <h1 className="text-3xl font-semibold leading-tight">Agenda Sekolah</h1>
        <p className="text-sm text-muted-foreground">Informasi kegiatan mendatang dan arsip event sekolah.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/agenda?tab=upcoming" className={`rounded border px-3 py-1.5 ${tab === "upcoming" ? "bg-muted" : "hover:bg-muted/70"}`}>
          Upcoming
        </Link>
        <Link href="/agenda?tab=past" className={`rounded border px-3 py-1.5 ${tab === "past" ? "bg-muted" : "hover:bg-muted/70"}`}>
          Past
        </Link>
        <Link href="/agenda?tab=all" className={`rounded border px-3 py-1.5 ${tab === "all" ? "bg-muted" : "hover:bg-muted/70"}`}>
          Semua
        </Link>
      </div>

      <form action="/agenda" className="neo-card flex flex-wrap items-end gap-2 p-3">
        <input type="hidden" name="tab" value={tab} />
        <label className="min-w-[220px] flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">Cari agenda</span>
          <input
            type="search"
            name="q"
            defaultValue={query.q || ""}
            placeholder="Cari judul, lokasi, atau deskripsi..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
          Cari
        </button>
        <Link href={`/agenda?tab=${tab}`} className="rounded-md border px-3 py-2 text-sm hover:bg-muted/70">
          Reset
        </Link>
      </form>

      {result.items.length === 0 ? (
        <PublicEmptyState
          title={hasActiveFilter ? "Tidak ada agenda yang cocok" : "Belum ada agenda dipublikasikan"}
          description={
            hasActiveFilter
              ? "Coba ubah kata kunci pencarian atau lihat semua tab agenda."
              : "Agenda sekolah akan muncul di sini setelah dipublikasikan."
          }
          actions={[
            { href: `/agenda?tab=${tab}`, label: "Reset Pencarian", variant: "primary" },
            tab !== "all" ? { href: "/agenda?tab=all", label: "Lihat Semua Agenda" } : { href: "/", label: "Kembali ke Beranda" },
          ]}
        />
      ) : (
        <div className="grid gap-4">
          {result.items.map((item) => (
            <article key={item.id} className="neo-card space-y-3 p-5 sm:p-6">
              {item.coverMedia?.id ? (
                <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/public/cms/media/${item.coverMedia.id}`}
                    alt={item.coverMedia.alt || item.title}
                    className="h-48 w-full object-cover sm:h-56"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded border px-2 py-0.5">{item.location || "Lokasi TBD"}</span>
                <span>Mulai: {formatDateTime(item.startAt)}</span>
                {item.endAt ? <span>Selesai: {formatDateTime(item.endAt)}</span> : null}
              </div>
              <h2 className="text-xl font-semibold leading-tight">{item.title}</h2>
              {item.description ? <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p> : null}
              <Link href={`/agenda/${item.slug}`} className="inline-flex rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted/70">
                Lihat detail
              </Link>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="text-muted-foreground">
          Menampilkan {result.items.length} dari total {result.total} event.
        </div>
        <div className="flex items-center gap-2">
          {query.page > 1 ? (
            <Link
              href={`/agenda?${buildAgendaQueryString({
                tab,
                page: query.page - 1,
                q: query.q,
              })}`}
              className="rounded border px-3 py-1.5 hover:bg-muted/70"
            >
              Sebelumnya
            </Link>
          ) : null}
          {query.page * query.pageSize < result.total ? (
            <Link
              href={`/agenda?${buildAgendaQueryString({
                tab,
                page: query.page + 1,
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
