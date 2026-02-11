"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

export type PortalChild = {
  id: string;
  nis?: string;
  name: string;
  relation: "SELF" | "GUARDIAN";
  classroom: { name: string } | null;
  academicYear: { name: string } | null;
};

export type PortalMe = {
  student: { id: string; nis?: string; name: string } | null;
  children: PortalChild[];
  selectedChildId: string | null;
};

export function appendChildId(url: string, childId?: string | null) {
  if (!childId) return url;

  const [pathPart, hashPart] = url.split("#", 2);
  const [basePath, queryString = ""] = pathPart.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("childId", childId);

  const query = params.toString();
  const withQuery = query ? `${basePath}?${query}` : basePath;
  return hashPart ? `${withQuery}#${hashPart}` : withQuery;
}

export function usePortalStudentScope() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedChildId = searchParams.get("childId");

  const meQuery = useQuery<PortalMe>({
    queryKey: ["portal-me", requestedChildId ?? "default"],
    queryFn: async () => {
      const res = await fetch(appendChildId("/api/portal/me", requestedChildId));
      if (!res.ok) throw new Error("Failed to load portal profile");
      return (await res.json()) as PortalMe;
    },
  });

  const selectedChildId = meQuery.data?.selectedChildId ?? requestedChildId ?? null;

  const childScopedUrl = useMemo(
    () => (url: string) => appendChildId(url, selectedChildId),
    [selectedChildId]
  );

  const setSelectedChildId = (nextChildId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextChildId) params.set("childId", nextChildId);
    else params.delete("childId");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return {
    me: meQuery.data,
    isLoading: meQuery.isLoading,
    selectedChildId,
    childScopedUrl,
    setSelectedChildId,
  };
}

export function PortalStudentScopeBanner({
  me,
  isLoading,
  onSelectChild,
}: {
  me: PortalMe | undefined;
  isLoading?: boolean;
  onSelectChild: (childId: string | null) => void;
}) {
  if (isLoading) {
    return <div className="rounded-md border p-3 text-sm text-muted-foreground">Memuat data siswa...</div>;
  }

  if (!me?.student) {
    return <div className="rounded-md border border-amber-400/50 bg-amber-100/40 p-3 text-sm">Akun ini belum terhubung dengan data siswa.</div>;
  }

  const selected = me.children.find((child) => child.id === me.selectedChildId) ?? me.children[0] ?? null;

  if (me.children.length <= 1) {
    return (
      <div className="rounded-md border p-3 text-sm">
        <div className="font-medium">Siswa Aktif: {selected?.name ?? me.student.name}</div>
        <div className="text-muted-foreground">
          {selected?.classroom?.name ? `Kelas ${selected.classroom.name}` : "Belum ada kelas aktif"}
          {selected?.academicYear?.name ? ` • TA ${selected.academicYear.name}` : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3">
      <label className="mb-1 block text-xs text-muted-foreground">Pilih Anak</label>
      <select
        className="w-full rounded-md border px-3 py-2 text-sm md:max-w-sm"
        value={me.selectedChildId ?? ""}
        onChange={(event) => onSelectChild(event.target.value || null)}
      >
        {me.children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name}
            {child.classroom?.name ? ` - ${child.classroom.name}` : ""}
            {child.relation === "GUARDIAN" ? " (Wali)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
