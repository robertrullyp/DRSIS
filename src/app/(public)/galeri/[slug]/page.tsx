import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCmsGalleryBySlug } from "@/server/cms/gallery.service";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getPublishedCmsGalleryBySlug(slug);
  if (!gallery) {
    return { title: "Galeri tidak ditemukan" };
  }

  const imageUrl = gallery.coverMedia?.id ? `/api/public/cms/media/${gallery.coverMedia.id}` : undefined;

  return {
    title: gallery.title,
    description: gallery.description || gallery.title,
    openGraph: {
      title: gallery.title,
      description: gallery.description || gallery.title,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  };
}

export default async function PublicGalleryDetailPage({ params }: Props) {
  const { slug } = await params;
  const gallery = await getPublishedCmsGalleryBySlug(slug);
  if (!gallery) notFound();

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-6">
      <article className="neo-card space-y-4 p-6 sm:p-8">
        <Link href="/galeri" className="inline-flex rounded border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/70">
          Kembali ke daftar galeri
        </Link>

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold leading-tight">{gallery.title}</h1>
          {gallery.description ? <p className="text-sm text-muted-foreground">{gallery.description}</p> : null}
          <p className="text-xs text-muted-foreground">{gallery.items.length} item dokumentasi</p>
        </header>

        {gallery.coverMedia?.id ? (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/public/cms/media/${gallery.coverMedia.id}`}
              alt={gallery.coverMedia.alt || gallery.title}
              className="h-auto max-h-[460px] w-full object-cover"
            />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.items.map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-lg border border-border/70 bg-card/70">
              <div className="aspect-[4/3] bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.media.publicPath} alt={item.media.alt || item.media.filename} className="h-full w-full object-cover" loading="lazy" />
              </div>
              {item.caption ? <figcaption className="p-2 text-xs text-muted-foreground">{item.caption}</figcaption> : null}
            </figure>
          ))}
          {gallery.items.length === 0 ? <p className="text-xs text-muted-foreground">Belum ada item galeri.</p> : null}
        </div>
      </article>
    </main>
  );
}
