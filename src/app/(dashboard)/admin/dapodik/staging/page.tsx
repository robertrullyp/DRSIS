"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DataTable,
  DataTableCell,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeaderCell,
  DataTablePagination,
  DataTableRow,
} from "@/components/ui/data-table";

type StagingStatus = "NEW" | "MATCHED" | "CONFLICT" | "REJECTED";

type StagingRow = {
  id: string;
  batchId: string;
  entityType: string;
  externalId: string;
  status: StagingStatus;
  dataJson: string;
  matchedLocalType: string | null;
  matchedLocalId: string | null;
  conflictJson: string | null;
  notes: string | null;
  createdAt: string;
  batch?: { id: string; kind: string; status: string; createdAt: string };
};

type StagingListResponse = {
  items: StagingRow[];
  total: number;
  page: number;
  pageSize: number;
};

function formatTs(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return value;
  return d.toLocaleString("id-ID");
}

type Draft = {
  status: StagingStatus;
  matchedLocalType: string;
  matchedLocalId: string;
  notes: string;
};

export default function AdminDapodikStagingPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | StagingStatus>("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (entityType.trim()) params.set("entityType", entityType.trim());
    return params.toString();
  }, [page, pageSize, q, status, entityType]);

  const listQuery = useQuery<StagingListResponse>({
    queryKey: ["admin-dapodik-staging", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/dapodik/staging?${queryString}`);
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(typeof payload?.error === "string" ? payload.error : "Failed to fetch staging rows");
      }
      return (await res.json()) as StagingListResponse;
    },
  });

  const rows = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const currentPage = listQuery.data?.page ?? page;
  const currentPageSize = listQuery.data?.pageSize ?? pageSize;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage * currentPageSize < total;

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  function getDraft(row: StagingRow): Draft {
    const existing = drafts[row.id];
    if (existing) return existing;
    return {
      status: row.status,
      matchedLocalType: row.matchedLocalType || "",
      matchedLocalId: row.matchedLocalId || "",
      notes: row.notes || "",
    };
  }

  const saveMutation = useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: Draft }) => {
      const res = await fetch(`/api/admin/dapodik/staging/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: draft.status,
          matchedLocalType: draft.matchedLocalType || null,
          matchedLocalId: draft.matchedLocalId || null,
          notes: draft.notes || null,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: unknown } | StagingRow | null;
      if (!res.ok) {
        throw new Error(typeof (payload as { error?: unknown } | null)?.error === "string" ? (payload as { error: string }).error : "Gagal menyimpan");
      }
      return payload as StagingRow;
    },
    onSuccess: async () => {
      setMessage("Staging row tersimpan.");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-dapodik-staging"] });
      await qc.invalidateQueries({ queryKey: ["admin-dapodik-batches"] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Admin: Dapodik Staging</h1>
        <p className="text-sm text-muted-foreground">Tabel staging untuk proses rekonsiliasi data (NEW/MATCHED/CONFLICT/REJECTED).</p>
      </div>

      {message ? <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{message}</div> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className="space-y-1 lg:col-span-2">
          <span className="text-xs text-muted-foreground">Cari</span>
          <input
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            placeholder="externalId / entityType / matchedLocalId"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Status</span>
          <select
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
          >
            <option value="">Semua</option>
            <option value="NEW">NEW</option>
            <option value="MATCHED">MATCHED</option>
            <option value="CONFLICT">CONFLICT</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </label>
        <label className="space-y-1 lg:col-span-2">
          <span className="text-xs text-muted-foreground">Entity Type</span>
          <input
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
              setPage(1);
            }}
            placeholder="school / teacher / student / rombel ..."
          />
        </label>
        <button
          type="button"
          className="self-end rounded-md border px-3 py-2 text-sm hover:bg-muted/70"
          onClick={() => {
            setQ("");
            setStatus("");
            setEntityType("");
            setPage(1);
            setPageSize(20);
          }}
        >
          Reset
        </button>
      </div>

      <DataTablePagination
        page={currentPage}
        pageSize={currentPageSize}
        total={total}
        visibleCount={rows.length}
        itemLabel="row"
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPageChange={(nextPage) => setPage(Math.max(1, nextPage))}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />

      <DataTable minWidthClassName="min-w-[1480px]">
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Created</DataTableHeaderCell>
            <DataTableHeaderCell>Batch</DataTableHeaderCell>
            <DataTableHeaderCell>Entity</DataTableHeaderCell>
            <DataTableHeaderCell>External ID</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
            <DataTableHeaderCell>Local Match</DataTableHeaderCell>
            <DataTableHeaderCell>Notes</DataTableHeaderCell>
            <DataTableHeaderCell>Data</DataTableHeaderCell>
            <DataTableHeaderCell>Aksi</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <tbody>
          {rows.length === 0 ? (
            <DataTableEmptyRow message={listQuery.isLoading ? "Memuat..." : "Belum ada staging row."} colSpan={9} />
          ) : (
            rows.map((row) => {
              const draft = getDraft(row);
              return (
                <DataTableRow key={row.id}>
                  <DataTableCell>{formatTs(row.createdAt)}</DataTableCell>
                  <DataTableCell>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{row.batch?.kind ?? "batch"}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{row.batchId}</div>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="font-medium">{row.entityType}</DataTableCell>
                  <DataTableCell className="font-mono text-[11px]">{row.externalId}</DataTableCell>
                  <DataTableCell>
                    <select
                      className="w-[160px] rounded-md border px-2 py-1.5 text-sm"
                      value={draft.status}
                      onChange={(event) => {
                        const value = event.target.value as StagingStatus;
                        setDrafts((prev) => ({ ...prev, [row.id]: { ...draft, status: value } }));
                      }}
                    >
                      <option value="NEW">NEW</option>
                      <option value="MATCHED">MATCHED</option>
                      <option value="CONFLICT">CONFLICT</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="w-full rounded-md border px-2 py-1.5 text-sm"
                        value={draft.matchedLocalType}
                        onChange={(event) => setDrafts((prev) => ({ ...prev, [row.id]: { ...draft, matchedLocalType: event.target.value } }))}
                        placeholder="LocalType (Student)"
                      />
                      <input
                        className="w-full rounded-md border px-2 py-1.5 text-sm"
                        value={draft.matchedLocalId}
                        onChange={(event) => setDrafts((prev) => ({ ...prev, [row.id]: { ...draft, matchedLocalId: event.target.value } }))}
                        placeholder="LocalId"
                      />
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <input
                      className="w-[260px] rounded-md border px-2 py-1.5 text-sm"
                      value={draft.notes}
                      onChange={(event) => setDrafts((prev) => ({ ...prev, [row.id]: { ...draft, notes: event.target.value } }))}
                      placeholder="notes..."
                    />
                  </DataTableCell>
                  <DataTableCell>
                    <details>
                      <summary className="cursor-pointer text-xs text-muted-foreground">JSON</summary>
                      <pre className="mt-2 max-h-40 overflow-auto rounded-md border bg-muted/30 p-2 text-[11px] leading-snug">
                        {row.dataJson}
                      </pre>
                    </details>
                  </DataTableCell>
                  <DataTableCell>
                    <button
                      type="button"
                      className="rounded-md bg-accent px-3 py-2 text-xs font-medium text-accent-foreground disabled:opacity-50"
                      disabled={saveMutation.isPending}
                      onClick={() => saveMutation.mutate({ id: row.id, draft })}
                    >
                      Save
                    </button>
                  </DataTableCell>
                </DataTableRow>
              );
            })
          )}
        </tbody>
      </DataTable>
    </div>
  );
}

