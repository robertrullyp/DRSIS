import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { readCmsPostPreviewToken } from "@/server/cms/post-preview";
import { getCmsPostPreviewById } from "@/server/cms/post.service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Preview Berita",
  description: "Mode preview konten berita sebelum dipublikasikan.",
};

function getSearchParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function renderContentWithInlineMedia(content: string): ReactNode[] {
  const result: ReactNode[] = [];
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
  let cursor = 0;
  let index = 0;

  while (true) {
    const match = imagePattern.exec(content);
    if (!match) break;

    const [full, altText, src] = match;
    const textPart = content.slice(cursor, match.index);
    if (textPart) {
      result.push(
        <span key={`text-${index}`} className="whitespace-pre-wrap">
          {textPart}
        </span>
      );
      index += 1;
    }

    result.push(
      <span key={`img-${index}`} className="my-3 block overflow-hidden rounded-lg border border-border/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={altText || "Post image"} className="h-auto w-full object-cover" loading="lazy" />
      </span>
    );
    index += 1;
    cursor = match.index + full.length;
  }

  const remaining = content.slice(cursor);
  if (remaining) {
    result.push(
      <span key={`text-${index}`} className="whitespace-pre-wrap">
        {remaining}
      </span>
    );
  }

  return result;
}

export default async function PublicNewsPreviewPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = (getSearchParam(params, "token") || "").trim();
  if (!token) notFound();

  const payload = readCmsPostPreviewToken(token);
  if (!payload) notFound();

  const post = await getCmsPostPreviewById(payload.postId);
  if (!post) notFound();

  const previewUntil = new Date(payload.exp);

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-10 sm:px-6">
      <div className="rounded-lg border border-amber-500/60 bg-amber-100/50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
        Mode preview aktif. Tautan ini berlaku sampai {previewUntil.toLocaleString()}.
      </div>
      <article className="neo-card space-y-4 p-6 sm:p-8">
        <Link href="/berita" className="inline-flex rounded border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/70">
          Kembali ke daftar berita
        </Link>
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded border px-2 py-0.5">{post.type}</span>
            <span className="rounded border px-2 py-0.5">Status: {post.status}</span>
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

        <div className="prose prose-sm max-w-none text-foreground/95 dark:prose-invert">{renderContentWithInlineMedia(post.content)}</div>
      </article>
    </main>
  );
}
