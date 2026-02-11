import { prisma } from "@/lib/prisma";

const DEFAULT_BASE_URL = "http://localhost:3000";

function ensureAbsoluteBaseUrl(raw: string) {
  const value = raw.trim();
  if (!value) return DEFAULT_BASE_URL;
  if (/^https?:\/\//i.test(value)) return value.replace(/\/$/, "");
  return `https://${value.replace(/\/$/, "")}`;
}

export function resolvePublicSiteUrl() {
  return ensureAbsoluteBaseUrl(process.env.NEXTAUTH_URL || DEFAULT_BASE_URL);
}

export type CmsSitemapEntry = {
  url: string;
  lastModified: Date;
};

export type CmsSitemapPayload = {
  entries: CmsSitemapEntry[];
  generatedAt: Date;
};

function mapWithBase(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function byPublishedAtDescending<T extends { publishedAt: Date | null; updatedAt: Date }>(items: T[]) {
  return items.sort((a, b) => {
    const aTime = (a.publishedAt || a.updatedAt).getTime();
    const bTime = (b.publishedAt || b.updatedAt).getTime();
    return bTime - aTime;
  });
}

export async function getCmsSitemapPayload(): Promise<CmsSitemapPayload> {
  const now = new Date();
  const baseUrl = resolvePublicSiteUrl();

  const publishedWhere = {
    deletedAt: null,
    status: "PUBLISHED" as const,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };

  const [posts, events, galleries, pages] = await Promise.all([
    prisma.cmsPost.findMany({
      where: publishedWhere,
      select: { slug: true, publishedAt: true, updatedAt: true },
    }),
    prisma.cmsEvent.findMany({
      where: publishedWhere,
      select: { slug: true, publishedAt: true, updatedAt: true },
    }),
    prisma.cmsGallery.findMany({
      where: publishedWhere,
      select: { slug: true, publishedAt: true, updatedAt: true },
    }),
    prisma.cmsPage.findMany({
      where: publishedWhere,
      select: { slug: true, publishedAt: true, updatedAt: true },
    }),
  ]);

  const staticEntries: CmsSitemapEntry[] = [
    { url: mapWithBase(baseUrl, "/"), lastModified: now },
    { url: mapWithBase(baseUrl, "/berita"), lastModified: now },
    { url: mapWithBase(baseUrl, "/agenda"), lastModified: now },
    { url: mapWithBase(baseUrl, "/galeri"), lastModified: now },
  ];

  const postEntries = byPublishedAtDescending(posts).map((item) => ({
    url: mapWithBase(baseUrl, `/berita/${item.slug}`),
    lastModified: item.updatedAt,
  }));

  const eventEntries = byPublishedAtDescending(events).map((item) => ({
    url: mapWithBase(baseUrl, `/agenda/${item.slug}`),
    lastModified: item.updatedAt,
  }));

  const galleryEntries = byPublishedAtDescending(galleries).map((item) => ({
    url: mapWithBase(baseUrl, `/galeri/${item.slug}`),
    lastModified: item.updatedAt,
  }));

  const pageEntries = byPublishedAtDescending(pages).map((item) => ({
    url: mapWithBase(baseUrl, `/p/${item.slug}`),
    lastModified: item.updatedAt,
  }));

  return {
    entries: [...staticEntries, ...postEntries, ...eventEntries, ...galleryEntries, ...pageEntries],
    generatedAt: now,
  };
}

export type CmsRobotsPayload = {
  sitemapUrl: string;
  rules: string[];
};

export function getCmsRobotsPayload(): CmsRobotsPayload {
  const baseUrl = resolvePublicSiteUrl();
  return {
    sitemapUrl: mapWithBase(baseUrl, "/sitemap.xml"),
    rules: ["User-agent: *", "Allow: /", "Disallow: /api/"],
  };
}

function escapeXml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildSitemapXml(payload: CmsSitemapPayload) {
  const items = payload.entries
    .map((entry) => {
      const loc = escapeXml(entry.url);
      const lastmod = entry.lastModified.toISOString();
      return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`;
}

export function buildRobotsTxt(payload: CmsRobotsPayload) {
  return `${payload.rules.join("\n")}\n\nSitemap: ${payload.sitemapUrl}\n`;
}
