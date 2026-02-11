import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { CMS_CACHE_TAGS } from "@/server/cms/cache-tags";
import type { CmsMenuReplaceInput } from "@/server/cms/dto/menu.dto";
import { CmsServiceError } from "@/server/cms/page.service";

type CmsMenuTreeItem = {
  id: string;
  label: string;
  type: "INTERNAL" | "EXTERNAL" | "PAGE" | "CATEGORY" | "TAG";
  href: string;
  order: number;
  children: CmsMenuTreeItem[];
};

function normalizeHref(raw: string | null | undefined) {
  return (raw ?? "").trim();
}

function isPublished(item: {
  status: string;
  publishedAt: Date | null;
  deletedAt: Date | null;
}) {
  if (item.deletedAt) return false;
  if (item.status !== "PUBLISHED") return false;
  if (item.publishedAt && item.publishedAt > new Date()) return false;
  return true;
}

function resolveMenuHref(item: {
  type: "INTERNAL" | "EXTERNAL" | "PAGE" | "CATEGORY" | "TAG";
  href: string | null;
  page: { slug: string; status: string; publishedAt: Date | null; deletedAt: Date | null } | null;
}) {
  if (item.type === "PAGE") {
    if (!item.page || !isPublished(item.page)) return null;
    return `/p/${item.page.slug}`;
  }

  const href = normalizeHref(item.href);
  if (!href) return null;

  return href;
}

export async function listCmsMenus() {
  return prisma.cmsMenu.findMany({
    include: {
      items: {
        include: {
          page: true,
        },
        orderBy: [{ parentId: "asc" }, { order: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function replaceCmsMenuItems(menuId: string, input: CmsMenuReplaceInput) {
  const menu = await prisma.cmsMenu.findUnique({ where: { id: menuId } });
  if (!menu) {
    throw new CmsServiceError(404, "NOT_FOUND", "Menu not found");
  }

  return prisma.$transaction(async (tx) => {
    await tx.cmsMenuItem.deleteMany({ where: { menuId } });

    for (let i = 0; i < input.items.length; i += 1) {
      const root = input.items[i];
      const rootItem = await tx.cmsMenuItem.create({
        data: {
          menuId,
          label: root.label,
          type: root.type,
          href: root.href,
          pageId: root.pageId,
          order: root.order ?? i + 1,
          isActive: root.isActive ?? true,
        },
      });

      const children = root.children ?? [];
      for (let j = 0; j < children.length; j += 1) {
        const child = children[j];
        await tx.cmsMenuItem.create({
          data: {
            menuId,
            parentId: rootItem.id,
            label: child.label,
            type: child.type,
            href: child.href,
            pageId: child.pageId,
            order: child.order ?? j + 1,
            isActive: child.isActive ?? true,
          },
        });
      }
    }

    return tx.cmsMenu.findUnique({
      where: { id: menuId },
      include: {
        items: {
          include: { page: true },
          orderBy: [{ parentId: "asc" }, { order: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  });
}

async function getPublicCmsMenuUncached(name: string): Promise<CmsMenuTreeItem[]> {
  const menu = await prisma.cmsMenu.findUnique({
    where: { name },
    include: {
      items: {
        where: { isActive: true },
        include: { page: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!menu) return [];

  const rootItems = menu.items.filter((item) => item.parentId === null);

  const buildItem = (itemId: string): CmsMenuTreeItem | null => {
    const item = menu.items.find((entry) => entry.id === itemId);
    if (!item) return null;

    const href = resolveMenuHref({
      type: item.type,
      href: item.href,
      page: item.page,
    });

    if (!href) return null;

    const children = menu.items
      .filter((entry) => entry.parentId === item.id)
      .map((entry) => buildItem(entry.id))
      .filter((entry): entry is CmsMenuTreeItem => Boolean(entry));

    return {
      id: item.id,
      label: item.label,
      type: item.type,
      href,
      order: item.order,
      children,
    };
  };

  return rootItems
    .map((item) => buildItem(item.id))
    .filter((item): item is CmsMenuTreeItem => Boolean(item))
    .sort((a, b) => a.order - b.order);
}

const getPublicCmsMenuCached = unstable_cache(
  async (name: string) => getPublicCmsMenuUncached(name),
  ["cms-public-menu"],
  {
    tags: [CMS_CACHE_TAGS.menu, CMS_CACHE_TAGS.public],
    revalidate: 300,
  }
);

export async function getPublicCmsMenu(name: string): Promise<CmsMenuTreeItem[]> {
  return getPublicCmsMenuCached(name);
}
