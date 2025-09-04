"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type Permission = { id: string; name: string; description?: string | null };
type Role = { id: string; name: string; displayName?: string | null; perms?: { permission: Permission }[] };

export default function AdminRolesPage() {
  const qc = useQueryClient();
  const { data: perms } = useQuery<{ items: Permission[] }>({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/permissions");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Permission[] };
    },
  });
  const { data: rolesData, isFetching } = useQuery<{ items: Role[] }>({
    queryKey: ["roles-with-perms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Role[] };
    },
  });

  const [msg, setMsg] = useState<string>("");
  const clearMsg = () => setTimeout(() => setMsg(""), 2000);

  const update = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      const res = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles-with-perms"] });
      setMsg("Tersimpan");
      clearMsg();
    },
    onError: () => {
      setMsg("Gagal menyimpan");
      clearMsg();
    },
  });

  const permMap = useMemo(() => new Map((perms?.items ?? []).map((p) => [p.id, p] as const)), [perms]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Admin: Roles & Permissions</h1>
      {msg && <div className="text-sm px-3 py-2 rounded border inline-block">{msg}</div>}
      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <div className="space-y-6">
          {(rolesData?.items ?? []).map((r) => {
            const assigned = new Set((r.perms ?? []).map((rp) => rp.permission.id));
            const toggle = (id: string) => {
              if (assigned.has(id)) assigned.delete(id);
              else assigned.add(id);
            };
            return (
              <div key={r.id} className="border rounded p-4">
                <div className="font-medium mb-2">{r.displayName || r.name}</div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(perms?.items ?? []).map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        defaultChecked={assigned.has(p.id)}
                        onChange={() => toggle(p.id)}
                      />
                      <span>{p.name}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <button
                    className="bg-black text-white rounded px-3 py-1 text-sm"
                    onClick={() => update.mutate({ roleId: r.id, permissionIds: Array.from(assigned) })}
                    disabled={update.isPending}
                  >
                    Simpan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

