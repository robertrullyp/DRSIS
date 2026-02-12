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

type CmsMenuTreeAccessItem = {
  id: string;
  label: string;
  type: "INTERNAL" | "EXTERNAL" | "PAGE" | "CATEGORY" | "TAG";
  href: string;
  order: number;
  visibility: "PUBLIC" | "AUTH_ONLY" | "ROLE_ONLY";
  roleNames: string[];
  children: CmsMenuTreeAccessItem[];
};

export type CmsMenuAudience = {
  isAuthenticated: boolean;
  roles: string[];
};

function normalizeHref(raw: string | null | undefined) {
  return (raw ?? "").trim();
}

function splitRoleNames(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))];
}

function joinRoleNames(roleNames: string[] | undefined) {
  if (!roleNames || roleNames.length === 0) return null;
  return [...new Set(roleNames.map((item) => item.trim()).filter(Boolean))].join(",");
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

function canSeeByVisibility(item: Pick<CmsMenuTreeAccessItem, "visibility" | "roleNames">, audience: CmsMenuAudience) {
  if (item.visibility === "PUBLIC") return true;
  if (item.visibility === "AUTH_ONLY") return audience.isAuthenticated;
  if (!audience.isAuthenticated || item.roleNames.length === 0) return false;
  return item.roleNames.some((role) => audience.roles.includes(role));
}

function filterMenuTreeByAudience(items: CmsMenuTreeAccessItem[], audience: CmsMenuAudience): CmsMenuTreeItem[] {
  return items
    .filter((item) => canSeeByVisibility(item, audience))
    .map((item) => ({
      ...item,
      children: filterMenuTreeByAudience(item.children, audience),
    }))
    .map((item) => ({
      id: item.id,
      label: item.label,
      type: item.type,
      href: item.href,
      order: item.order,
      children: item.children,
    }));
}

export async function listCmsMenus() {
  const menus = await prisma.cmsMenu.findMany({
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

  return menus.map((menu) => ({
    ...menu,
    items: menu.items.map((item) => ({
      ...item,
      roleNames: splitRoleNames(item.roleNames),
    })),
  }));
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
          visibility: root.visibility ?? "PUBLIC",
          roleNames: joinRoleNames(root.roleNames),
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
            visibility: child.visibility ?? "PUBLIC",
            roleNames: joinRoleNames(child.roleNames),
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

async function getPublicCmsMenuUncached(name: string): Promise<CmsMenuTreeAccessItem[]> {
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

  const buildItem = (itemId: string): CmsMenuTreeAccessItem | null => {
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
      .filter((entry): entry is CmsMenuTreeAccessItem => Boolean(entry));

    return {
      id: item.id,
      label: item.label,
      type: item.type,
      href,
      order: item.order,
      visibility: item.visibility,
      roleNames: splitRoleNames(item.roleNames),
      children,
    };
  };

  return rootItems
    .map((item) => buildItem(item.id))
    .filter((item): item is CmsMenuTreeAccessItem => Boolean(item))
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

export async function getPublicCmsMenu(
  name: string,
  audience: CmsMenuAudience = { isAuthenticated: false, roles: [] }
): Promise<CmsMenuTreeItem[]> {
  const items = await getPublicCmsMenuCached(name);
  const normalizedAudience: CmsMenuAudience = {
    isAuthenticated: Boolean(audience.isAuthenticated),
    roles: Array.isArray(audience.roles) ? audience.roles : [],
  };

  return filterMenuTreeByAudience(items, normalizedAudience);
}
