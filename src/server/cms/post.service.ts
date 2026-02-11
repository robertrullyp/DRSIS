import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { unstable_cache } from "next/cache";
import { CMS_CACHE_TAGS } from "@/server/cms/cache-tags";
import type {
  CmsPostCreateInput,
  CmsPostListQueryInput,
  CmsPostUpdateInput,
  CmsPublicPostListQueryInput,
} from "@/server/cms/dto/post.dto";
import { CmsServiceError } from "@/server/cms/page.service";

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
  return value || "artikel";
}

async function assertSlugAvailable(slug: string, currentId?: string) {
  const existing = await prisma.cmsPost.findUnique({ where: { slug } });
  if (!existing) return;
  if (currentId && existing.id === currentId) return;
  throw new CmsServiceError(409, "SLUG_EXISTS", "Slug already exists");
}

const postInclude = {
  coverMedia: true,
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
} as const;

type CmsPostWithRelations = Prisma.CmsPostGetPayload<{ include: typeof postInclude }>;

function mapPost(item: CmsPostWithRelations) {
  return {
    ...item,
    categories: item.categories.map((entry) => ({
      id: entry.category.id,
      name: entry.category.name,
      slug: entry.category.slug,
    })),
    tags: item.tags.map((entry) => ({
      id: entry.tag.id,
      name: entry.tag.name,
      slug: entry.tag.slug,
    })),
  };
}

async function replacePostTaxonomy(postId: string, categoryIds: string[] | undefined, tagIds: string[] | undefined) {
  if (!categoryIds && !tagIds) return;

  await prisma.$transaction(async (tx) => {
    if (categoryIds) {
      await tx.cmsPostCategory.deleteMany({ where: { postId } });
      if (categoryIds.length > 0) {
        await tx.cmsPostCategory.createMany({
          data: categoryIds.map((categoryId) => ({ postId, categoryId })),
          skipDuplicates: true,
        });
      }
    }

    if (tagIds) {
      await tx.cmsPostTag.deleteMany({ where: { postId } });
      if (tagIds.length > 0) {
        await tx.cmsPostTag.createMany({
          data: tagIds.map((tagId) => ({ postId, tagId })),
          skipDuplicates: true,
        });
      }
    }
  });
}

function normalizeIds(ids: string[] | undefined) {
  if (!ids) return undefined;
  return [...new Set(ids.filter(Boolean))];
}

export async function listCmsPosts(query: CmsPostListQueryInput) {
  const { page, pageSize, q, status, type } = query;

  const where: Prisma.CmsPostWhereInput = { deletedAt: null };
  if (status) where.status = status;
  if (type) where.type = type;
  if (q) {
    where.OR = [{ title: { contains: q } }, { slug: { contains: q } }, { excerpt: { contains: q } }];
  }

  const [items, total] = await Promise.all([
    prisma.cmsPost.findMany({
      where,
      include: postInclude,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cmsPost.count({ where }),
  ]);

  return {
    items: items.map((item) => mapPost(item)),
    total,
    page,
    pageSize,
  };
}

export async function getCmsPostById(id: string) {
  const item = await prisma.cmsPost.findUnique({
    where: { id },
    include: postInclude,
  });

  if (!item || item.deletedAt) {
    throw new CmsServiceError(404, "NOT_FOUND", "Post not found");
  }

  return mapPost(item);
}

export async function createCmsPost(input: CmsPostCreateInput, userId: string) {
  const slug = resolveSlug(input.slug, input.title);
  await assertSlugAvailable(slug);

  const status = input.status ?? "DRAFT";
  const publish = status === "PUBLISHED";
  const categoryIds = normalizeIds(input.categoryIds);
  const tagIds = normalizeIds(input.tagIds);

  const created = await prisma.cmsPost.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      type: input.type ?? "NEWS",
      status,
      coverMediaId: input.coverMediaId,
      createdBy: userId,
      updatedBy: userId,
      authorId: userId,
      publishedAt: publish ? new Date() : null,
      publishedBy: publish ? userId : null,
    },
  });

  await replacePostTaxonomy(created.id, categoryIds, tagIds);
  return getCmsPostById(created.id);
}

export async function updateCmsPost(id: string, input: CmsPostUpdateInput, userId: string) {
  const existing = await getCmsPostById(id);

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

  await prisma.cmsPost.update({
    where: { id },
    data: {
      title: input.title,
      slug: nextSlug,
      excerpt: input.excerpt,
      content: input.content,
      type: input.type,
      status: nextStatus,
      coverMediaId: input.coverMediaId === undefined ? undefined : input.coverMediaId,
      updatedBy: userId,
      publishedAt: shouldPublishNow ? new Date() : shouldUnpublish ? null : undefined,
      publishedBy: shouldPublishNow ? userId : shouldUnpublish ? null : undefined,
    },
  });

  await replacePostTaxonomy(id, normalizeIds(input.categoryIds), normalizeIds(input.tagIds));
  return getCmsPostById(id);
}

export async function deleteCmsPost(id: string, userId: string) {
  await getCmsPostById(id);

  await prisma.cmsPost.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "ARCHIVED",
      updatedBy: userId,
    },
  });

  return { ok: true };
}

export async function publishCmsPost(id: string, userId: string) {
  await getCmsPostById(id);

  await prisma.cmsPost.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedBy: userId,
      updatedBy: userId,
    },
  });

  return getCmsPostById(id);
}

export async function unpublishCmsPost(id: string, userId: string) {
  await getCmsPostById(id);

  await prisma.cmsPost.update({
    where: { id },
    data: {
      status: "DRAFT",
      publishedAt: null,
      publishedBy: null,
      updatedBy: userId,
    },
  });

  return getCmsPostById(id);
}

async function listPublishedCmsPostsUncached(query: CmsPublicPostListQueryInput) {
  const { page, pageSize, q, type, category, tag } = query;
  const now = new Date();

  const andConditions: Prisma.CmsPostWhereInput[] = [{ OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] }];
  if (q) {
    andConditions.push({
      OR: [{ title: { contains: q } }, { slug: { contains: q } }, { excerpt: { contains: q } }],
    });
  }
  if (category) {
    andConditions.push({
      categories: {
        some: {
          category: {
            slug: category,
          },
        },
      },
    });
  }
  if (tag) {
    andConditions.push({
      tags: {
        some: {
          tag: {
            slug: tag,
          },
        },
      },
    });
  }

  const where: Prisma.CmsPostWhereInput = {
    deletedAt: null,
    status: "PUBLISHED" as const,
    AND: andConditions,
    ...(type ? { type } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.cmsPost.findMany({
      where,
      include: postInclude,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cmsPost.count({ where }),
  ]);

  return {
    items: items.map((item) => mapPost(item)),
    total,
    page,
    pageSize,
  };
}

const listPublishedCmsPostsCached = unstable_cache(
  async (query: CmsPublicPostListQueryInput) => listPublishedCmsPostsUncached(query),
  ["cms-public-post-list"],
  {
    tags: [CMS_CACHE_TAGS.public, CMS_CACHE_TAGS.posts, CMS_CACHE_TAGS.taxonomy],
    revalidate: 300,
  }
);

export async function listPublishedCmsPosts(query: CmsPublicPostListQueryInput) {
  return listPublishedCmsPostsCached(query);
}

async function listPublishedCmsPostTaxonomyUncached() {
  const now = new Date();
  const publishedPostWhere: Prisma.CmsPostWhereInput = {
    deletedAt: null,
    status: "PUBLISHED",
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };

  const [categories, tags] = await Promise.all([
    prisma.cmsCategory.findMany({
      where: {
        posts: {
          some: {
            post: publishedPostWhere,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.cmsTag.findMany({
      where: {
        posts: {
          some: {
            post: publishedPostWhere,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    categories: categories.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
    })),
    tags: tags.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
    })),
  };
}

const listPublishedCmsPostTaxonomyCached = unstable_cache(
  async () => listPublishedCmsPostTaxonomyUncached(),
  ["cms-public-post-taxonomy"],
  {
    tags: [CMS_CACHE_TAGS.public, CMS_CACHE_TAGS.posts, CMS_CACHE_TAGS.taxonomy],
    revalidate: 300,
  }
);

export async function listPublishedCmsPostTaxonomy() {
  return listPublishedCmsPostTaxonomyCached();
}

export async function getCmsPostPreviewById(id: string) {
  const item = await prisma.cmsPost.findUnique({
    where: { id },
    include: postInclude,
  });

  if (!item || item.deletedAt) {
    return null;
  }

  return mapPost(item);
}

async function getPublishedCmsPostBySlugUncached(slug: string) {
  const now = new Date();
  const item = await prisma.cmsPost.findFirst({
    where: {
      slug,
      deletedAt: null,
      status: "PUBLISHED",
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
    },
    include: postInclude,
  });

  return item ? mapPost(item) : null;
}

const getPublishedCmsPostBySlugCached = unstable_cache(
  async (slug: string) => getPublishedCmsPostBySlugUncached(slug),
  ["cms-public-post-by-slug"],
  {
    tags: [CMS_CACHE_TAGS.public, CMS_CACHE_TAGS.posts],
    revalidate: 300,
  }
);

export async function getPublishedCmsPostBySlug(slug: string) {
  return getPublishedCmsPostBySlugCached(slug);
}
