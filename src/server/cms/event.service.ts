import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { CMS_CACHE_TAGS } from "@/server/cms/cache-tags";
import type {
  CmsEventCreateInput,
  CmsEventListQueryInput,
  CmsEventUpdateInput,
  CmsPublicEventListQueryInput,
} from "@/server/cms/dto/event.dto";
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
  return value || "agenda";
}

async function assertSlugAvailable(slug: string, currentId?: string) {
  const existing = await prisma.cmsEvent.findUnique({ where: { slug } });
  if (!existing) return;
  if (currentId && existing.id === currentId) return;
  throw new CmsServiceError(409, "SLUG_EXISTS", "Slug already exists");
}

async function assertMediaExists(mediaId: string | undefined | null) {
  if (!mediaId) return;
  const exists = await prisma.cmsMedia.findUnique({ where: { id: mediaId }, select: { id: true } });
  if (!exists) {
    throw new CmsServiceError(400, "NOT_FOUND", "Media not found");
  }
}

const eventInclude = {
  coverMedia: true,
} satisfies Prisma.CmsEventInclude;

type CmsEventWithRelations = Prisma.CmsEventGetPayload<{
  include: {
    coverMedia: true;
  };
}>;

function mapEvent(item: CmsEventWithRelations) {
  return {
    ...item,
    coverMedia: item.coverMedia
      ? {
          ...item.coverMedia,
          previewPath: `/api/admin/cms/media/${item.coverMedia.id}/file`,
          publicPath: `/api/public/cms/media/${item.coverMedia.id}`,
        }
      : null,
  };
}

export async function listCmsEvents(query: CmsEventListQueryInput) {
  const { page, pageSize, q, status } = query;

  const where: Prisma.CmsEventWhereInput = { deletedAt: null };
  if (status) where.status = status;
  if (q) {
    where.OR = [{ title: { contains: q } }, { slug: { contains: q } }, { description: { contains: q } }, { location: { contains: q } }];
  }

  const [items, total] = await Promise.all([
    prisma.cmsEvent.findMany({
      where,
      include: eventInclude,
      orderBy: [{ startAt: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cmsEvent.count({ where }),
  ]);

  return {
    items: items.map((item) => mapEvent(item)),
    total,
    page,
    pageSize,
  };
}

export async function getCmsEventById(id: string) {
  const item = await prisma.cmsEvent.findUnique({ where: { id }, include: eventInclude });
  if (!item || item.deletedAt) {
    throw new CmsServiceError(404, "NOT_FOUND", "Event not found");
  }

  return mapEvent(item);
}

export async function createCmsEvent(input: CmsEventCreateInput, userId: string) {
  const slug = resolveSlug(input.slug, input.title);
  await assertSlugAvailable(slug);
  await assertMediaExists(input.coverMediaId);

  if (input.endAt && input.endAt < input.startAt) {
    throw new CmsServiceError(400, "NOT_FOUND", "endAt must be greater than or equal to startAt");
  }

  const status = input.status ?? "DRAFT";
  const publish = status === "PUBLISHED";

  const created = await prisma.cmsEvent.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      location: input.location,
      startAt: input.startAt,
      endAt: input.endAt,
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
    type: "cms.event.create",
    entity: "CmsEvent",
    entityId: created.id,
    meta: {
      slug: created.slug,
      status: created.status,
      startAt: created.startAt,
      endAt: created.endAt,
    },
  });

  return getCmsEventById(created.id);
}

export async function updateCmsEvent(id: string, input: CmsEventUpdateInput, userId: string) {
  const existing = await getCmsEventById(id);

  const nextTitle = input.title ?? existing.title;
  const nextSlug =
    typeof input.slug === "undefined" && typeof input.title === "undefined"
      ? existing.slug
      : resolveSlug(input.slug, nextTitle);

  if (nextSlug !== existing.slug) {
    await assertSlugAvailable(nextSlug, existing.id);
  }

  await assertMediaExists(input.coverMediaId);

  const nextStartAt = input.startAt ?? existing.startAt;
  const nextEndAt = input.endAt === undefined ? existing.endAt : input.endAt;
  if (nextEndAt && nextEndAt < nextStartAt) {
    throw new CmsServiceError(400, "NOT_FOUND", "endAt must be greater than or equal to startAt");
  }

  const nextStatus = input.status ?? existing.status;
  const shouldPublishNow = nextStatus === "PUBLISHED" && !existing.publishedAt;
  const shouldUnpublish = nextStatus !== "PUBLISHED";

  await prisma.cmsEvent.update({
    where: { id },
    data: {
      title: input.title,
      slug: nextSlug,
      description: input.description,
      location: input.location,
      startAt: input.startAt,
      endAt: input.endAt === undefined ? undefined : input.endAt,
      coverMediaId: input.coverMediaId === undefined ? undefined : input.coverMediaId,
      status: nextStatus,
      updatedBy: userId,
      publishedAt: shouldPublishNow ? new Date() : shouldUnpublish ? null : undefined,
      publishedBy: shouldPublishNow ? userId : shouldUnpublish ? null : undefined,
    },
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "cms.event.update",
    entity: "CmsEvent",
    entityId: id,
    meta: {
      slug: nextSlug,
      status: nextStatus,
      prevStatus: existing.status,
    },
  });

  return getCmsEventById(id);
}

export async function deleteCmsEvent(id: string, userId: string) {
  await getCmsEventById(id);

  await prisma.cmsEvent.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "ARCHIVED",
      updatedBy: userId,
    },
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "cms.event.delete",
    entity: "CmsEvent",
    entityId: id,
  });

  return { ok: true };
}

export async function publishCmsEvent(id: string, userId: string) {
  await getCmsEventById(id);

  await prisma.cmsEvent.update({
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
    type: "cms.event.publish",
    entity: "CmsEvent",
    entityId: id,
  });

  return getCmsEventById(id);
}

export async function unpublishCmsEvent(id: string, userId: string) {
  await getCmsEventById(id);

  await prisma.cmsEvent.update({
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
    type: "cms.event.unpublish",
    entity: "CmsEvent",
    entityId: id,
  });

  return getCmsEventById(id);
}

async function listPublishedCmsEventsUncached(query: CmsPublicEventListQueryInput) {
  const { page, pageSize, q, tab } = query;
  const now = new Date();

  const andConditions: Prisma.CmsEventWhereInput[] = [{ OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] }];

  if (tab === "upcoming") {
    andConditions.push({ startAt: { gte: now } });
  } else if (tab === "past") {
    andConditions.push({ startAt: { lt: now } });
  }

  if (q) {
    andConditions.push({
      OR: [{ title: { contains: q } }, { slug: { contains: q } }, { description: { contains: q } }, { location: { contains: q } }],
    });
  }

  const where: Prisma.CmsEventWhereInput = {
    deletedAt: null,
    status: "PUBLISHED",
    AND: andConditions,
  };

  const [items, total] = await Promise.all([
    prisma.cmsEvent.findMany({
      where,
      include: eventInclude,
      orderBy: tab === "past" ? [{ startAt: "desc" }] : [{ startAt: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cmsEvent.count({ where }),
  ]);

  return {
    items: items.map((item) => mapEvent(item)),
    total,
    page,
    pageSize,
  };
}

const listPublishedCmsEventsCached = unstable_cache(
  async (query: CmsPublicEventListQueryInput) => listPublishedCmsEventsUncached(query),
  ["cms-public-event-list"],
  {
    tags: [CMS_CACHE_TAGS.public, CMS_CACHE_TAGS.events],
    revalidate: 300,
  }
);

export async function listPublishedCmsEvents(query: CmsPublicEventListQueryInput) {
  return listPublishedCmsEventsCached(query);
}

async function getPublishedCmsEventBySlugUncached(slug: string) {
  const now = new Date();
  const item = await prisma.cmsEvent.findFirst({
    where: {
      slug,
      deletedAt: null,
      status: "PUBLISHED",
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
    },
    include: eventInclude,
  });

  return item ? mapEvent(item) : null;
}

const getPublishedCmsEventBySlugCached = unstable_cache(
  async (slug: string) => getPublishedCmsEventBySlugUncached(slug),
  ["cms-public-event-by-slug"],
  {
    tags: [CMS_CACHE_TAGS.public, CMS_CACHE_TAGS.events],
    revalidate: 300,
  }
);

export async function getPublishedCmsEventBySlug(slug: string) {
  return getPublishedCmsEventBySlugCached(slug);
}
