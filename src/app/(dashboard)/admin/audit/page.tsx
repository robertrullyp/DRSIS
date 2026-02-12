"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AuditEventRow = {
  id: string;
  actorId: string | null;
  type: string;
  entity: string | null;
  entityId: string | null;
  metaJson: string | null;
  occurredAt: string;
};

type AuditEventListResponse = {
  items: AuditEventRow[];
  total: number;
  page: number;
  pageSize: number;
};

function buildQuery(input: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (!value) continue;
    params.set(key, value);
  }
  return params.toString();
}

function formatTs(value: string) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return value;
  return d.toLocaleString("id-ID");
}

export default function AdminAuditLogPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [entity, setEntity] = useState("");
  const [actorId, setActorId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const queryString = useMemo(
    () =>
      buildQuery({
        page: String(page),
        pageSize: String(pageSize),
        q: q || undefined,
        type: type || undefined,
        entity: entity || undefined,
        actorId: actorId || undefined,
      }),
    [page, pageSize, q, type, entity, actorId],
  );

  const listQuery = useQuery<AuditEventListResponse>({
    queryKey: ["admin-audit-events", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/audit/events?${queryString}`);
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(typeof payload?.error === "string" ? payload.error : "Failed to fetch audit events");
      }
      return (await res.json()) as AuditEventListResponse;
    },
  });

  const data = listQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Admin: Audit Log</h1>

      <div className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 md:grid-cols-5 md:items-end">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-muted-foreground">Cari</label>
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="type/entity/entityId/meta/actorId"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Type</label>
          <Input
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            placeholder="cms.post.create"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Entity</label>
          <Input
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
            placeholder="CmsPost"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Actor ID</label>
          <Input
            value={actorId}
            onChange={(e) => {
              setActorId(e.target.value);
              setPage(1);
            }}
            placeholder="userId"
          />
        </div>
      </div>

      {listQuery.isLoading ? <div>Memuat…</div> : null}
      {listQuery.error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {(listQuery.error as Error).message}
        </div>
      ) : null}

      {!listQuery.isLoading && data ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <div>Total: {data.total}</div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <span>
                Page {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="border-b p-2 text-left">Waktu</th>
                  <th className="border-b p-2 text-left">Type</th>
                  <th className="border-b p-2 text-left">Actor</th>
                  <th className="border-b p-2 text-left">Entity</th>
                  <th className="border-b p-2 text-left">Entity ID</th>
                  <th className="border-b p-2 text-left">Meta</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="border-b p-2 whitespace-nowrap">{formatTs(row.occurredAt)}</td>
                    <td className="border-b p-2">{row.type}</td>
                    <td className="border-b p-2">{row.actorId ?? "-"}</td>
                    <td className="border-b p-2">{row.entity ?? "-"}</td>
                    <td className="border-b p-2">{row.entityId ?? "-"}</td>
                    <td className="border-b p-2 font-mono text-xs text-muted-foreground">
                      {row.metaJson
                        ? row.metaJson.length > 180
                          ? `${row.metaJson.slice(0, 180)}…`
                          : row.metaJson
                        : "-"}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={6}>
                      Belum ada audit events atau filter terlalu ketat.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

