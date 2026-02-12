import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublishedCmsPageBySlug } from "@/server/cms/page.service";
import { toAbsoluteUrl } from "@/lib/site-url";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedCmsPageBySlug(slug);
  if (!page) {
    return {
      title: "Halaman tidak ditemukan",
    };
  }

  const canonicalPath = `/p/${slug}`;
  const description = page.excerpt || page.title;

  return {
    title: page.title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: page.title,
      description,
      type: "website",
      url: canonicalPath,
      images: [{ url: toAbsoluteUrl("/og-default.svg") }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description,
      images: [toAbsoluteUrl("/og-default.svg")],
    },
  };
}

export default async function PublicCmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPublishedCmsPageBySlug(slug);
  if (!page) notFound();
  const canonicalPath = `/p/${page.slug}`;
  const blocks = Array.isArray(page.blocks) ? page.blocks : [];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: toAbsoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Halaman", item: toAbsoluteUrl("/p/" + page.slug) },
      { "@type": "ListItem", position: 3, name: page.title, item: toAbsoluteUrl(canonicalPath) },
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
            <li className="text-foreground">{page.title}</li>
          </ol>
        </nav>
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Halaman Publik</p>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Template: {page.template}</p>
          <h1 className="text-3xl font-semibold leading-tight">{page.title}</h1>
          {page.excerpt ? <p className="text-sm text-muted-foreground">{page.excerpt}</p> : null}
        </header>
        <div className="prose prose-sm max-w-none text-foreground/95 dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ alt, src }) => {
                if (!src) return null;
                return (
                  <span className="my-3 block overflow-hidden rounded-lg border border-border/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={alt || "Page image"} className="h-auto w-full object-cover" loading="lazy" />
                  </span>
                );
              },
            }}
          >
            {page.content}
          </ReactMarkdown>
        </div>
        {blocks.length > 0 ? (
          <section className="space-y-3 border-t border-border/60 pt-4">
            <h2 className="text-sm font-semibold">Sections</h2>
            <div className="space-y-2">
              {blocks.map((block, index) => (
                (() => {
                  const record = typeof block === "object" && block !== null ? (block as Record<string, unknown>) : {};
                  const type = typeof record.type === "string" ? record.type : "section";
                  const title = typeof record.title === "string" ? record.title : null;
                  const body = typeof record.body === "string" ? record.body : null;

                  return (
                    <div key={index} className="rounded-md border border-border/60 bg-card/60 p-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{type}</p>
                      {title ? <p className="font-medium">{title}</p> : null}
                      {body ? <p className="mt-1 text-muted-foreground">{body}</p> : null}
                    </div>
                  );
                })()
              ))}
            </div>
          </section>
        ) : null}
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </main>
  );
}
