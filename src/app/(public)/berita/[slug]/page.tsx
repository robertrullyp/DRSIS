import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublishedCmsPostBySlug } from "@/server/cms/post.service";
import { toAbsoluteUrl } from "@/lib/site-url";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedCmsPostBySlug(slug);
  if (!post) {
    return { title: "Berita tidak ditemukan" };
  }

  const description = post.excerpt || post.title;
  const canonicalPath = `/berita/${slug}`;
  const imageUrl = post.coverMedia?.id ? `/api/public/cms/media/${post.coverMedia.id}` : "/og-default.svg";

  return {
    title: post.title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: canonicalPath,
      images: [{ url: toAbsoluteUrl(imageUrl) }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [toAbsoluteUrl(imageUrl)],
    },
  };
}

export default async function PublicNewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedCmsPostBySlug(slug);
  if (!post) notFound();

  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : null;
  const canonicalPath = `/berita/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.title,
    datePublished: publishedDate?.toISOString(),
    image: [toAbsoluteUrl(post.coverMedia?.id ? `/api/public/cms/media/${post.coverMedia.id}` : "/og-default.svg")],
    mainEntityOfPage: toAbsoluteUrl(canonicalPath),
    author: {
      "@type": "Organization",
      name: "Sekolah",
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: toAbsoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Berita", item: toAbsoluteUrl("/berita") },
      { "@type": "ListItem", position: 3, name: post.title, item: toAbsoluteUrl(canonicalPath) },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <article className="neo-card space-y-4 p-6 sm:p-8">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:underline">
                Beranda
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/berita" className="hover:underline">
                Berita
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground">{post.title}</li>
          </ol>
        </nav>
        <Link href="/berita" className="inline-flex rounded border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/70">
          Kembali ke daftar berita
        </Link>
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded border px-2 py-0.5">{post.type}</span>
            <span>{publishedDate ? publishedDate.toLocaleString() : "Belum dijadwalkan"}</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight">{post.title}</h1>
          {post.excerpt ? <p className="text-sm text-muted-foreground">{post.excerpt}</p> : null}
        </header>

        {post.coverMedia?.id ? (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/public/cms/media/${post.coverMedia.id}`}
              alt={post.coverMedia.alt || post.title}
              className="h-auto max-h-[420px] w-full object-cover"
            />
          </div>
        ) : null}

        <div className="prose prose-sm max-w-none text-foreground/95 dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ alt, src }) => {
                if (!src) return null;
                return (
                  <span className="my-3 block overflow-hidden rounded-lg border border-border/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={alt || "Post image"} className="h-auto w-full object-cover" loading="lazy" />
                  </span>
                );
              },
              a: ({ href, children }) => {
                if (!href) return <span>{children}</span>;
                return (
                  <a href={href} target="_blank" rel="noreferrer" className="underline">
                    {children}
                  </a>
                );
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </main>
  );
}
