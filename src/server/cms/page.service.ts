import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { CMS_CACHE_TAGS } from "@/server/cms/cache-tags";
import type { CmsPageCreateInput, CmsPageListQueryInput, CmsPageUpdateInput } from "@/server/cms/dto/page.dto";

type CmsServiceErrorCode = "NOT_FOUND" | "SLUG_EXISTS";

export class CmsServiceError extends Error {
  status: number;
  code: CmsServiceErrorCode;

  constructor(status: number, code: CmsServiceErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function resolveSlug(slug: string | undefined, title: string) {
  const source = slug && slug.length > 0 ? slug : title;
  const value = slugify(source);
  return value || "halaman";
}

async function assertSlugAvailable(slug: string, currentId?: string) {
  const existing = await prisma.cmsPage.findUnique({ where: { slug } });
  if (!existing) return;
  if (currentId && existing.id === currentId) return;
  throw new CmsServiceError(409, "SLUG_EXISTS", "Slug already exists");
}

export async function listCmsPages(query: CmsPageListQueryInput) {
  const { page, pageSize, q, status } = query;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { excerpt: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.cmsPage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cmsPage.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getCmsPageById(id: string) {
  const item = await prisma.cmsPage.findUnique({ where: { id } });
  if (!item || item.deletedAt) {
    throw new CmsServiceError(404, "NOT_FOUND", "Page not found");
  }
  return item;
}

export async function createCmsPage(input: CmsPageCreateInput, userId: string) {
  const slug = resolveSlug(input.slug, input.title);
  await assertSlugAvailable(slug);

  const status = input.status ?? "DRAFT";
  const publish = status === "PUBLISHED";

  return prisma.cmsPage.create({
    data: {
      title: input.title,
      slug,
      content: input.content,
      excerpt: input.excerpt,
      status,
      createdBy: userId,
      updatedBy: userId,
      publishedAt: publish ? new Date() : null,
      publishedBy: publish ? userId : null,
    },
  });
}

export async function updateCmsPage(id: string, input: CmsPageUpdateInput, userId: string) {
  const existing = await getCmsPageById(id);

  const nextTitle = input.title ?? existing.title;
  const nextSlug =
    typeof input.slug === "undefined" && typeof input.title === "undefined"
      ? existing.slug
      : resolveSlug(input.slug, nextTitle);

  if (nextSlug !== existing.slug) {
    await assertSlugAvailable(nextSlug, existing.id);
  }

  const nextStatus = input.status ?? existing.status;
  const shouldPublishNow = nextStatus === "PUBLISHED" && !existing.publishedAt;
  const shouldUnpublish = nextStatus !== "PUBLISHED";

  return prisma.cmsPage.update({
    where: { id },
    data: {
      title: input.title,
      slug: nextSlug,
      content: input.content,
      excerpt: input.excerpt,
      status: nextStatus,
      updatedBy: userId,
      publishedAt: shouldPublishNow ? new Date() : shouldUnpublish ? null : undefined,
      publishedBy: shouldPublishNow ? userId : shouldUnpublish ? null : undefined,
    },
  });
}

export async function deleteCmsPage(id: string, userId: string) {
  await getCmsPageById(id);
  return prisma.cmsPage.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedBy: userId,
      status: "ARCHIVED",
    },
  });
}

export async function publishCmsPage(id: string, userId: string) {
  await getCmsPageById(id);
  return prisma.cmsPage.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedBy: userId,
      updatedBy: userId,
    },
  });
}

export async function unpublishCmsPage(id: string, userId: string) {
  await getCmsPageById(id);
  return prisma.cmsPage.update({
    where: { id },
    data: {
      status: "DRAFT",
      publishedAt: null,
      publishedBy: null,
      updatedBy: userId,
    },
  });
}

async function getPublishedCmsPageBySlugUncached(slug: string) {
  const now = new Date();
  return prisma.cmsPage.findFirst({
    where: {
      slug,
      deletedAt: null,
      status: "PUBLISHED",
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
    },
  });
}

const getPublishedCmsPageBySlugCached = unstable_cache(
  async (slug: string) => getPublishedCmsPageBySlugUncached(slug),
  ["cms-public-page-by-slug"],
  {
    tags: [CMS_CACHE_TAGS.public, CMS_CACHE_TAGS.pages],
    revalidate: 300,
  }
);

export async function getPublishedCmsPageBySlug(slug: string) {
  return getPublishedCmsPageBySlugCached(slug);
}
