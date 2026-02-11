import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCmsEventBySlug } from "@/server/cms/event.service";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedCmsEventBySlug(slug);
  if (!event) {
    return { title: "Agenda tidak ditemukan" };
  }

  const description = event.description || event.title;
  const imageUrl = event.coverMedia?.id ? `/api/public/cms/media/${event.coverMedia.id}` : undefined;

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "website",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  };
}

function formatDateTime(value: Date | string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default async function PublicAgendaDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getPublishedCmsEventBySlug(slug);
  if (!event) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || event.title,
    startDate: new Date(event.startAt).toISOString(),
    endDate: event.endAt ? new Date(event.endAt).toISOString() : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: event.location
      ? {
          "@type": "Place",
          name: event.location,
        }
      : undefined,
    image: event.coverMedia?.id ? [`/api/public/cms/media/${event.coverMedia.id}`] : undefined,
    organizer: {
      "@type": "Organization",
      name: "Sekolah",
    },
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <article className="neo-card space-y-4 p-6 sm:p-8">
        <Link href="/agenda" className="inline-flex rounded border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/70">
          Kembali ke daftar agenda
        </Link>

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold leading-tight">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded border px-2 py-0.5">{event.location || "Lokasi TBD"}</span>
            <span>Mulai: {formatDateTime(event.startAt)}</span>
            {event.endAt ? <span>Selesai: {formatDateTime(event.endAt)}</span> : null}
          </div>
        </header>

        {event.coverMedia?.id ? (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/public/cms/media/${event.coverMedia.id}`}
              alt={event.coverMedia.alt || event.title}
              className="h-auto max-h-[420px] w-full object-cover"
            />
          </div>
        ) : null}

        {event.description ? (
          <div className="prose prose-sm max-w-none text-foreground/95 dark:prose-invert">
            <p className="whitespace-pre-wrap">{event.description}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Deskripsi event belum tersedia.</p>
        )}
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
