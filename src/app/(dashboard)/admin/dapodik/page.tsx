"use client";

import Link from "next/link";
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

type BatchRow = {
  id: string;
  kind: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string | null;
  requestedBy: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  metaJson: string | null;
  createdAt: string;
  updatedAt: string;
};

type BatchListResponse = {
  items: BatchRow[];
  total: number;
  page: number;
  pageSize: number;
};

type ProcessResponse = {
  ok: true;
  processed: number;
  results: Record<string, "SUCCESS" | "RETRY" | "FAILED">;
  skipped?: boolean;
  error?: string;
};

function formatTs(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return value;
  return d.toLocaleString("id-ID");
}

export default function AdminDapodikPage() {
  const qc = useQueryClient();
  const [kind, setKind] = useState("REFERENCE_PULL");
  const [status, setStatus] = useState<"" | BatchRow["status"]>("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [page, pageSize, status, q]);

  const listQuery = useQuery<BatchListResponse>({
    queryKey: ["admin-dapodik-batches", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/dapodik/batches?${queryString}`);
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(typeof payload?.error === "string" ? payload.error : "Failed to fetch batches");
      }
      return (await res.json()) as BatchListResponse;
    },
  });

  const enqueueMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/dapodik/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: unknown } | BatchRow | null;
      if (!res.ok) {
        throw new Error(typeof (payload as { error?: unknown } | null)?.error === "string" ? (payload as { error: string }).error : "Gagal enqueue");
      }
      return payload as BatchRow;
    },
    onSuccess: async (created) => {
      setMessage(`Enqueued batch ${created.id} (${created.kind}).`);
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-dapodik-batches"] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Gagal enqueue");
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/dapodik/batches/${id}/retry`, { method: "POST" });
      const payload = (await res.json().catch(() => null)) as { error?: unknown } | BatchRow | null;
      if (!res.ok) {
        throw new Error(typeof (payload as { error?: unknown } | null)?.error === "string" ? (payload as { error: string }).error : "Gagal retry");
      }
      return payload as BatchRow;
    },
    onSuccess: async () => {
      setMessage("Batch di-reset untuk dicoba ulang.");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-dapodik-batches"] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Gagal retry");
    },
  });

  const processMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/dapodik/process?limit=20", { method: "POST" });
      const payload = (await res.json().catch(() => null)) as ProcessResponse | { error?: unknown } | null;
      if (!res.ok) {
        throw new Error(typeof (payload as { error?: unknown } | null)?.error === "string" ? (payload as { error: string }).error : "Gagal process queue");
      }
      return payload as ProcessResponse;
    },
    onSuccess: async (result) => {
      setError(null);
      if (result.skipped) {
        setMessage("Queue di-skip (DAPODIK_SYNC_ENABLED atau mode tidak aktif).");
      } else if (result.error) {
        setMessage(`Queue error: ${result.error}`);
      } else {
        setMessage(`Processed: ${result.processed}`);
      }
      await qc.invalidateQueries({ queryKey: ["admin-dapodik-batches"] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Gagal process queue");
    },
  });

  const rows = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const currentPage = listQuery.data?.page ?? page;
  const currentPageSize = listQuery.data?.pageSize ?? pageSize;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage * currentPageSize < total;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Admin: Integrasi Dapodik</h1>
        <p className="text-sm text-muted-foreground">
          Ini adalah antrian sinkronisasi (skeleton). Untuk demo, aktifkan <code>DAPODIK_SYNC_ENABLED=true</code> dan <code>DAPODIK_SYNC_MODE=mock</code>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/dapodik/staging" className="rounded-md border px-3 py-2 text-sm hover:bg-muted/70">
          Lihat Staging
        </Link>
      </div>

      <div className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-5 md:items-end">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-muted-foreground">Enqueue batch kind</label>
          <input className="w-full rounded-md border px-3 py-2" value={kind} onChange={(e) => setKind(e.target.value)} placeholder="REFERENCE_PULL" />
        </div>
        <button
          type="button"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          disabled={enqueueMutation.isPending}
          onClick={() => enqueueMutation.mutate()}
        >
          {enqueueMutation.isPending ? "Mengantre..." : "Enqueue"}
        </button>
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted/70 disabled:opacity-50"
          disabled={processMutation.isPending}
          onClick={() => processMutation.mutate()}
        >
          {processMutation.isPending ? "Memproses..." : "Process Queue Now"}
        </button>
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted/70"
          onClick={() => {
            setMessage(null);
            setError(null);
          }}
        >
          Clear
        </button>
      </div>

      {message ? <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{message}</div> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="space-y-1 lg:col-span-2">
          <span className="text-xs text-muted-foreground">Cari</span>
          <input
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            placeholder="kind / errorMessage"
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
            <option value="PENDING">PENDING</option>
            <option value="RUNNING">RUNNING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </label>
        <button
          type="button"
          className="self-end rounded-md border px-3 py-2 text-sm hover:bg-muted/70"
          onClick={() => {
            setQ("");
            setStatus("");
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
        itemLabel="batch"
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPageChange={(nextPage) => setPage(Math.max(1, nextPage))}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />

      <DataTable minWidthClassName="min-w-[1320px]">
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Created</DataTableHeaderCell>
            <DataTableHeaderCell>Kind</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
            <DataTableHeaderCell>Attempts</DataTableHeaderCell>
            <DataTableHeaderCell>Next Attempt</DataTableHeaderCell>
            <DataTableHeaderCell>Error</DataTableHeaderCell>
            <DataTableHeaderCell>Aksi</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <tbody>
          {rows.length === 0 ? (
            <DataTableEmptyRow message={listQuery.isLoading ? "Memuat..." : "Belum ada batch."} colSpan={7} />
          ) : (
            rows.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell>{formatTs(row.createdAt)}</DataTableCell>
                <DataTableCell className="font-medium">{row.kind}</DataTableCell>
                <DataTableCell>{row.status}</DataTableCell>
                <DataTableCell>
                  {row.attempts}/{row.maxAttempts}
                </DataTableCell>
                <DataTableCell>{formatTs(row.nextAttemptAt)}</DataTableCell>
                <DataTableCell className="max-w-[520px] truncate">{row.errorMessage || "-"}</DataTableCell>
                <DataTableCell>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs hover:bg-muted/70 disabled:opacity-50"
                    disabled={retryMutation.isPending}
                    onClick={() => retryMutation.mutate(row.id)}
                  >
                    Retry
                  </button>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
