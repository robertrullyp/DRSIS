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

type InboxItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  meta: {
    ip?: string | null;
    userAgent?: string | null;
    referer?: string | null;
    source?: string | null;
  } | null;
};

type InboxListResponse = {
  items: InboxItem[];
  total: number;
  page: number;
  pageSize: number;
};

export default function AdminCmsInboxPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [isRead, setIsRead] = useState<"" | "true" | "false">("");
  const [isResolved, setIsResolved] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q.trim().length > 0) params.set("q", q.trim());
    if (isRead) params.set("isRead", isRead);
    if (isResolved) params.set("isResolved", isResolved);
    return params.toString();
  }, [page, pageSize, q, isRead, isResolved]);

  const inboxQuery = useQuery<InboxListResponse>({
    queryKey: ["admin-cms-inbox", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/cms/inbox?${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch inbox");
      return (await res.json()) as InboxListResponse;
    },
  });

  const selectedMessage = useMemo(() => {
    if (!selectedId) return null;
    return inboxQuery.data?.items.find((item) => item.id === selectedId) ?? null;
  }, [inboxQuery.data?.items, selectedId]);

  const patchMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { isRead?: boolean; isResolved?: boolean } }) => {
      const res = await fetch(`/api/admin/cms/inbox/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update inbox");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cms-inbox"] });
    },
  });

  const rows = inboxQuery.data?.items ?? [];
  const total = inboxQuery.data?.total ?? 0;
  const currentPage = inboxQuery.data?.page ?? page;
  const currentPageSize = inboxQuery.data?.pageSize ?? pageSize;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage * currentPageSize < total;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">CMS Contact Inbox</h1>
          <p className="text-sm text-muted-foreground">Daftar pesan dari formulir kontak publik.</p>
        </div>
        <a
          href={`/api/admin/cms/inbox/export?${queryString}`}
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted/70"
          target="_blank"
          rel="noreferrer"
        >
          Export CSV
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] items-center gap-2">
          <label className="text-xs text-muted-foreground">Cari</label>
          <input
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            placeholder="nama/email/subjek/pesan..."
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Read</label>
          <select
            className="rounded-md border px-2 py-1.5 text-sm"
            value={isRead}
            onChange={(event) => {
              setIsRead(event.target.value as typeof isRead);
              setPage(1);
            }}
          >
            <option value="">Semua</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Resolved</label>
          <select
            className="rounded-md border px-2 py-1.5 text-sm"
            value={isResolved}
            onChange={(event) => {
              setIsResolved(event.target.value as typeof isResolved);
              setPage(1);
            }}
          >
            <option value="">Semua</option>
            <option value="false">Open</option>
            <option value="true">Resolved</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Page size</label>
          <select
            className="rounded-md border px-2 py-1.5 text-sm"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <DataTablePagination
        page={currentPage}
        pageSize={currentPageSize}
        total={total}
        visibleCount={rows.length}
        itemLabel="pesan"
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPageChange={(nextPage) => setPage(Math.max(1, nextPage))}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />

      {inboxQuery.isLoading ? (
        <div>Memuat inbox...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <DataTable minWidthClassName="min-w-[860px]">
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Pengirim</DataTableHeaderCell>
                <DataTableHeaderCell>Subjek</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell>Masuk</DataTableHeaderCell>
                <DataTableHeaderCell>Aksi</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <tbody>
              {rows.map((item) => (
                <DataTableRow key={item.id} className={selectedId === item.id ? "bg-muted/40" : ""}>
                  <DataTableCell>
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => {
                        setSelectedId(item.id);
                        if (!item.isRead) {
                          patchMutation.mutate({ id: item.id, payload: { isRead: true } });
                        }
                      }}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.email || item.phone || "Tanpa kontak"}</div>
                    </button>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="line-clamp-2 font-medium">{item.subject || "(Tanpa subjek)"}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{item.message}</div>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex flex-wrap gap-1">
                      <span className={`rounded border px-2 py-0.5 text-xs ${item.isRead ? "" : "border-amber-500 text-amber-700"}`}>
                        {item.isRead ? "Read" : "Unread"}
                      </span>
                      <span className={`rounded border px-2 py-0.5 text-xs ${item.isResolved ? "border-emerald-500 text-emerald-700" : ""}`}>
                        {item.isResolved ? "Resolved" : "Open"}
                      </span>
                    </div>
                  </DataTableCell>
                  <DataTableCell>{new Date(item.createdAt).toLocaleString()}</DataTableCell>
                  <DataTableCell>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs hover:bg-muted/70"
                        onClick={() => patchMutation.mutate({ id: item.id, payload: { isRead: true } })}
                      >
                        Mark Read
                      </button>
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs hover:bg-muted/70"
                        onClick={() => patchMutation.mutate({ id: item.id, payload: { isResolved: !item.isResolved, isRead: true } })}
                      >
                        {item.isResolved ? "Reopen" : "Resolve"}
                      </button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
              {rows.length === 0 ? <DataTableEmptyRow message="Belum ada pesan kontak masuk." colSpan={5} /> : null}
            </tbody>
          </DataTable>

          <section className="space-y-3 rounded-md border p-3">
            <h2 className="text-sm font-semibold">Detail Pesan</h2>
            {selectedMessage ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Nama</p>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p>{selectedMessage.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telepon</p>
                    <p>{selectedMessage.phone || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subjek</p>
                  <p>{selectedMessage.subject || "(Tanpa subjek)"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pesan</p>
                  <p className="whitespace-pre-wrap rounded border bg-muted/20 p-2 text-sm">{selectedMessage.message}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                  <p>Masuk: {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                  <p>IP: {selectedMessage.meta?.ip || "-"}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Pilih salah satu pesan untuk melihat detail.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
