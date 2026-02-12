import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { CMS_CACHE_TAGS } from "@/server/cms/cache-tags";
import type {
  CmsGalleryCreateInput,
  CmsGalleryItemInput,
  CmsGalleryListQueryInput,
  CmsGallerySetItemsInput,
  CmsGalleryUpdateInput,
  CmsPublicGalleryListQueryInput,
} from "@/server/cms/dto/gallery.dto";
import { CmsServiceError } from "@/server/cms/page.service";
import { writeAuditEvent } from "@/server/audit";

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
  return value || "galeri";
}

async function assertSlugAvailable(slug: string, currentId?: string) {
  const existing = await prisma.cmsGallery.findUnique({ where: { slug } });
  if (!existing) return;
  if (currentId && existing.id === currentId) return;
  throw new CmsServiceError(409, "SLUG_EXISTS", "Slug already exists");
}

const galleryInclude = {
  coverMedia: true,
  items: {
    include: { media: true },
    orderBy: [{ itemOrder: "asc" }, { createdAt: "asc" }] as Prisma.CmsGalleryItemOrderByWithRelationInput[],
  },
} satisfies Prisma.CmsGalleryInclude;

type CmsGalleryWithRelations = Prisma.CmsGalleryGetPayload<{
  include: {
    coverMedia: true;
    items: {
      include: {
        media: true;
      };
    };
  };
}>;

function mapGallery(item: CmsGalleryWithRelations) {
  return {
    ...item,
    coverMedia: item.coverMedia
      ? {
          ...item.coverMedia,
          previewPath: `/api/admin/cms/media/${item.coverMedia.id}/file`,
          publicPath: `/api/public/cms/media/${item.coverMedia.id}`,
        }
      : null,
    items: item.items.map((entry) => ({
      id: entry.id,
      mediaId: entry.mediaId,
      caption: entry.caption,
      order: entry.itemOrder,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      media: {
        ...entry.media,
        previewPath: `/api/admin/cms/media/${entry.media.id}/file`,
        publicPath: `/api/public/cms/media/${entry.media.id}`,
      },
    })),
  };
}

function normalizeItems(items: CmsGalleryItemInput[]) {
  return items.map((item, index) => ({
    mediaId: item.mediaId,
    caption: item.caption,
    order: Number.isFinite(item.order) ? item.order : index,
  }));
}

async function assertMediaExists(mediaIds: string[]) {
  if (mediaIds.length === 0) return;
  const existing = await prisma.cmsMedia.findMany({
    where: { id: { in: mediaIds } },
    select: { id: true },
  });

  const existingIds = new Set(existing.map((item) => item.id));
  const missing = mediaIds.filter((id) => !existingIds.has(id));
  if (missing.length > 0) {
    throw new CmsServiceError(400, "NOT_FOUND", "Some media items are not found");
  }
}

export async function listCmsGalleries(query: CmsGalleryListQueryInput) {
  const { page, pageSize, q, status } = query;

  const where: Prisma.CmsGalleryWhereInput = { deletedAt: null };
  if (status) where.status = status;
  if (q) {
    where.OR = [{ title: { contains: q } }, { slug: { contains: q } }, { description: { contains: q } }];
  }

  const [items, total] = await Promise.all([
    prisma.cmsGallery.findMany({
      where,
      include: galleryInclude,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cmsGallery.count({ where }),
  ]);

  return {
    items: items.map((item) => mapGallery(item)),
    total,
    page,
    pageSize,
  };
}

export async function getCmsGalleryById(id: string) {
  const item = await prisma.cmsGallery.findUnique({
    where: { id },
    include: galleryInclude,
  });
  if (!item || item.deletedAt) {
    throw new CmsServiceError(404, "NOT_FOUND", "Gallery not found");
  }

  return mapGallery(item);
}

export async function createCmsGallery(input: CmsGalleryCreateInput, userId: string) {
  const slug = resolveSlug(input.slug, input.title);
  await assertSlugAvailable(slug);

  const status = input.status ?? "DRAFT";
  const publish = status === "PUBLISHED";

  if (input.coverMediaId) {
    await assertMediaExists([input.coverMediaId]);
  }

  const created = await prisma.cmsGallery.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      coverMediaId: input.coverMediaId,
      status,
      createdBy: userId,
      updatedBy: userId,
      publishedAt: publish ? new Date() : null,
      publishedBy: publish ? userId : null,
    },
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "cms.gallery.create",
    entity: "CmsGallery",
    entityId: created.id,
    meta: { slug: created.slug, status: created.status },
  });

  return getCmsGalleryById(created.id);
}

export async function updateCmsGallery(id: string, input: CmsGalleryUpdateInput, userId: string) {
  const existing = await getCmsGalleryById(id);

  const nextTitle = input.title ?? existing.title;
  const nextSlug =
    typeof input.slug === "undefined" && typeof input.title === "undefined"
      ? existing.slug
      : resolveSlug(input.slug, nextTitle);

  if (nextSlug !== existing.slug) {
    await assertSlugAvailable(nextSlug, existing.id);
  }

  if (input.coverMediaId) {
    await assertMediaExists([input.coverMediaId]);
  }

  const nextStatus = input.status ?? existing.status;
  const shouldPublishNow = nextStatus === "PUBLISHED" && !existing.publishedAt;
  const shouldUnpublish = nextStatus !== "PUBLISHED";

  await prisma.cmsGallery.update({
    where: { id },
    data: {
      title: input.title,
      slug: nextSlug,
      description: input.description,
      coverMediaId: input.coverMediaId === undefined ? undefined : input.coverMediaId,
      status: nextStatus,
      updatedBy: userId,
      publishedAt: shouldPublishNow ? new Date() : shouldUnpublish ? null : undefined,
      publishedBy: shouldPublishNow ? userId : shouldUnpublish ? null : undefined,
    },
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "cms.gallery.update",
    entity: "CmsGallery",
    entityId: id,
    meta: { slug: nextSlug, status: nextStatus, prevStatus: existing.status },
  });

  return getCmsGalleryById(id);
}

export async function deleteCmsGallery(id: string, userId: string) {
  await getCmsGalleryById(id);

  await prisma.cmsGallery.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "ARCHIVED",
      updatedBy: userId,
    },
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "cms.gallery.delete",
    entity: "CmsGallery",
    entityId: id,
  });

  return { ok: true };
}

export async function publishCmsGallery(id: string, userId: string) {
  await getCmsGalleryById(id);

  await prisma.cmsGallery.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedBy: userId,
      updatedBy: userId,
    },
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "cms.gallery.publish",
    entity: "CmsGallery",
    entityId: id,
  });

  return getCmsGalleryById(id);
}

export async function unpublishCmsGallery(id: string, userId: string) {
  await getCmsGalleryById(id);

  await prisma.cmsGallery.update({
    where: { id },
    data: {
      status: "DRAFT",
      publishedAt: null,
      publishedBy: null,
      updatedBy: userId,
    },
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "cms.gallery.unpublish",
    entity: "CmsGallery",
    entityId: id,
  });

  return getCmsGalleryById(id);
}

export async function setCmsGalleryItems(id: string, input: CmsGallerySetItemsInput, userId: string) {
  await getCmsGalleryById(id);

  const normalizedItems = normalizeItems(input.items);
  const mediaIds = [...new Set(normalizedItems.map((item) => item.mediaId))];
  await assertMediaExists(mediaIds);

  await prisma.$transaction(async (tx) => {
    await tx.cmsGalleryItem.deleteMany({ where: { galleryId: id } });

    if (normalizedItems.length > 0) {
      await tx.cmsGalleryItem.createMany({
        data: normalizedItems.map((item, index) => ({
          galleryId: id,
          mediaId: item.mediaId,
          caption: item.caption,
          itemOrder: item.order ?? index,
        })),
      });
    }

    await tx.cmsGallery.update({
      where: { id },
      data: { updatedBy: userId },
    });

    await writeAuditEvent(tx, {
      actorId: userId,
      type: "cms.gallery.items.replace",
      entity: "CmsGallery",
      entityId: id,
      meta: { itemCount: normalizedItems.length },
    });
  });

  return getCmsGalleryById(id);
}

async function listPublishedCmsGalleriesUncached(query: CmsPublicGalleryListQueryInput) {
  const { page, pageSize, q } = query;
  const now = new Date();
  const andConditions: Prisma.CmsGalleryWhereInput[] = [{ OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] }];
  if (q) {
    andConditions.push({
      OR: [{ title: { contains: q } }, { slug: { contains: q } }, { description: { contains: q } }],
    });
  }

  const where: Prisma.CmsGalleryWhereInput = {
    deletedAt: null,
    status: "PUBLISHED",
    AND: andConditions,
  };

  const [items, total] = await Promise.all([
    prisma.cmsGallery.findMany({
      where,
      include: galleryInclude,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cmsGallery.count({ where }),
  ]);

  return {
    items: items.map((item) => mapGallery(item)),
    total,
    page,
    pageSize,
  };
}

const listPublishedCmsGalleriesCached = unstable_cache(
  async (query: CmsPublicGalleryListQueryInput) => listPublishedCmsGalleriesUncached(query),
  ["cms-public-gallery-list"],
  {
    tags: [CMS_CACHE_TAGS.public, CMS_CACHE_TAGS.galleries],
    revalidate: 300,
  }
);

export async function listPublishedCmsGalleries(query: CmsPublicGalleryListQueryInput) {
  return listPublishedCmsGalleriesCached(query);
}

async function getPublishedCmsGalleryBySlugUncached(slug: string) {
  const now = new Date();
  const item = await prisma.cmsGallery.findFirst({
    where: {
      slug,
      deletedAt: null,
      status: "PUBLISHED",
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
    },
    include: galleryInclude,
  });

  return item ? mapGallery(item) : null;
}

const getPublishedCmsGalleryBySlugCached = unstable_cache(
  async (slug: string) => getPublishedCmsGalleryBySlugUncached(slug),
  ["cms-public-gallery-by-slug"],
  {
    tags: [CMS_CACHE_TAGS.public, CMS_CACHE_TAGS.galleries],
    revalidate: 300,
  }
);

export async function getPublishedCmsGalleryBySlug(slug: string) {
  return getPublishedCmsGalleryBySlugCached(slug);
}
