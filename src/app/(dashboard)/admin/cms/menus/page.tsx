"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type CmsPageItem = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
};

type CmsMenuItem = {
  id: string;
  menuId: string;
  parentId: string | null;
  label: string;
  type: "INTERNAL" | "EXTERNAL" | "PAGE" | "CATEGORY" | "TAG";
  visibility: "PUBLIC" | "AUTH_ONLY" | "ROLE_ONLY";
  roleNames: string[];
  href: string | null;
  pageId: string | null;
  order: number;
  isActive: boolean;
};

type CmsMenu = {
  id: string;
  name: string;
  description: string | null;
  items: CmsMenuItem[];
};

type CmsMenuPayload = {
  label: string;
  type: "INTERNAL" | "EXTERNAL" | "PAGE" | "CATEGORY" | "TAG";
  visibility?: "PUBLIC" | "AUTH_ONLY" | "ROLE_ONLY";
  roleNames?: string[];
  href?: string;
  pageId?: string;
  order?: number;
  isActive?: boolean;
  children?: CmsMenuPayload[];
};

function toMenuPayload(items: CmsMenuItem[]) {
  const roots = items
    .filter((item) => item.parentId === null)
    .sort((a, b) => a.order - b.order);

  return roots.map((root) => {
    const children = items
      .filter((item) => item.parentId === root.id)
      .sort((a, b) => a.order - b.order)
      .map((child) => ({
        label: child.label,
        type: child.type,
        visibility: child.visibility,
        roleNames: child.roleNames,
        href: child.href || undefined,
        pageId: child.pageId || undefined,
        order: child.order,
        isActive: child.isActive,
      }));

    return {
      label: root.label,
      type: root.type,
      visibility: root.visibility,
      roleNames: root.roleNames,
      href: root.href || undefined,
      pageId: root.pageId || undefined,
      order: root.order,
      isActive: root.isActive,
      ...(children.length > 0 ? { children } : {}),
    } satisfies CmsMenuPayload;
  });
}

export default function AdminCmsMenusPage() {
  const queryClient = useQueryClient();
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [editorValue, setEditorValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const menusQuery = useQuery<{ items: CmsMenu[] }>({
    queryKey: ["admin-cms-menus"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cms/menus");
      if (!res.ok) throw new Error("Failed to load menus");
      return (await res.json()) as { items: CmsMenu[] };
    },
  });

  const pagesQuery = useQuery<{ items: CmsPageItem[] }>({
    queryKey: ["admin-cms-pages-published"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cms/pages?page=1&pageSize=200&status=PUBLISHED");
      if (!res.ok) throw new Error("Failed to load pages");
      return (await res.json()) as { items: CmsPageItem[] };
    },
  });

  const selectedMenu = useMemo(
    () => menusQuery.data?.items.find((menu) => menu.id === selectedMenuId) ?? null,
    [menusQuery.data?.items, selectedMenuId]
  );

  useEffect(() => {
    if (!menusQuery.data?.items?.length) return;
    if (!selectedMenuId) {
      setSelectedMenuId(menusQuery.data.items[0].id);
    }
  }, [menusQuery.data?.items, selectedMenuId]);

  useEffect(() => {
    if (!selectedMenu) return;
    const payload = toMenuPayload(selectedMenu.items);
    setEditorValue(JSON.stringify(payload, null, 2));
    setError(null);
  }, [selectedMenu]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMenuId) throw new Error("Menu belum dipilih");
      const parsed = JSON.parse(editorValue) as CmsMenuPayload[];
      const res = await fetch(`/api/admin/cms/menus/${selectedMenuId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsed }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Gagal menyimpan menu");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cms-menus"] });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">CMS Menus</h1>
        <p className="text-sm text-muted-foreground">Kelola menu publik (`main`, `footer`) dengan payload tree depth 2.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-muted-foreground">Pilih menu</label>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={selectedMenuId}
              onChange={(event) => setSelectedMenuId(event.target.value)}
            >
              {(menusQuery.data?.items ?? []).map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
              onClick={async () => {
                setError(null);
                try {
                  await saveMutation.mutateAsync();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Gagal menyimpan menu");
                }
              }}
              disabled={saveMutation.isPending || !selectedMenuId}
            >
              {saveMutation.isPending ? "Menyimpan..." : "Simpan Menu"}
            </button>
          </div>

          <textarea
            className="min-h-[420px] w-full rounded-md border px-3 py-2 font-mono text-xs"
            value={editorValue}
            onChange={(event) => setEditorValue(event.target.value)}
            spellCheck={false}
          />
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <p className="text-xs text-muted-foreground">
            Format item: `label`, `type`, `visibility`, `roleNames`, `href` atau `pageId`, `order`, `isActive`, `children`.
          </p>
        </div>

        <aside className="space-y-3 rounded-md border p-3">
          <h2 className="text-sm font-semibold">Published Pages Reference</h2>
          {(pagesQuery.data?.items ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada page berstatus PUBLISHED.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {(pagesQuery.data?.items ?? []).map((page) => (
                <li key={page.id} className="rounded border p-2">
                  <div className="font-medium">{page.title}</div>
                  <div className="text-muted-foreground">pageId: {page.id}</div>
                  <div className="text-muted-foreground">slug: /p/{page.slug}</div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
