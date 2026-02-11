"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Role = { id: string; name: string; displayName?: string | null };
type User = { id: string; name?: string | null; email: string; phone?: string | null; role?: Role | null; status: string };

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: roles } = useQuery<{ items: Role[] }>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Role[] };
    },
  });

  const { data, isFetching } = useQuery<{ items: User[]; total: number; page: number; pageSize: number }>({
    queryKey: ["admin-users", q, page, pageSize],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (q) p.set("q", q);
      const res = await fetch(`/api/admin/users?${p.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: User[]; total: number; page: number; pageSize: number };
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, roleId, status }: { id: string; roleId?: string | null; status?: string }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, status }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Admin: Users & Roles</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Cari</label>
          <input className="border rounded px-3 py-2" placeholder="nama/email/phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Page Size</label>
          <select className="border rounded px-3 py-2" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">Total: {data?.total ?? 0} | Halaman {data?.page ?? page} dari {totalPages}</div>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Email</th>
              <th className="text-left p-2 border-b">Phone</th>
              <th className="text-left p-2 border-b">Status</th>
              <th className="text-left p-2 border-b">Role</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((u) => (
              <tr key={u.id}>
                <td className="p-2 border-b">{u.name ?? "-"}</td>
                <td className="p-2 border-b">{u.email}</td>
                <td className="p-2 border-b">{u.phone ?? "-"}</td>
                <td className="p-2 border-b">{u.status}</td>
                <td className="p-2 border-b">
                  <select
                    className="border rounded px-2 py-1"
                    value={u.role?.id ?? ""}
                    onChange={(e) => update.mutate({ id: u.id, roleId: e.target.value || null })}
                  >
                    <option value="">(none)</option>
                    {roles?.items?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.displayName || r.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border-b">
                  <button
                    className="text-xs px-2 py-1 rounded border"
                    onClick={() => update.mutate({ id: u.id, status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}
                    disabled={update.isPending}
                  >
                    {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-end gap-2">
        <button className="border rounded px-3 py-1 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <button className="border rounded px-3 py-1 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}

