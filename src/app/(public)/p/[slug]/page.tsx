import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublishedCmsPageBySlug } from "@/server/cms/page.service";

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

  return {
    title: page.title,
    description: page.excerpt || page.title,
  };
}

export default async function PublicCmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPublishedCmsPageBySlug(slug);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <article className="neo-card space-y-4 p-6 sm:p-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Halaman Publik</p>
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
      </article>
    </main>
  );
}
