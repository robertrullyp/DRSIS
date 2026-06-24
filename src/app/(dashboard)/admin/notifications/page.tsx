"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DataTable,
  DataTableCell,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/ui/data-table";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  severity: "INFO" | "WARNING" | "DANGER";
  status: "UNREAD" | "READ" | "ARCHIVED";
  createdAt: string;
  recipient?: { email: string; name: string | null };
  student?: { nis: string | null; user?: { name: string | null } | null } | null;
};

type NotificationListResponse = {
  items: NotificationRow[];
  total: number;
};

export default function AdminNotificationsPage() {
  const qc = useQueryClient();
  const [recipientUserId, setRecipientUserId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [type, setType] = useState("announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [href, setHref] = useState("");
  const [severity, setSeverity] = useState<"INFO" | "WARNING" | "DANGER">("INFO");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listQuery = useQuery<NotificationListResponse>({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notifications?pageSize=50");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return (await res.json()) as NotificationListResponse;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUserId,
          studentId: studentId || null,
          type,
          title,
          body: body || null,
          href: href || null,
          severity,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: unknown } | NotificationRow | null;
      if (!res.ok) {
        throw new Error(typeof (payload as { error?: unknown } | null)?.error === "string" ? (payload as { error: string }).error : "Gagal membuat notifikasi");
      }
      return payload as NotificationRow;
    },
    onSuccess: async () => {
      setMessage("Notifikasi dibuat.");
      setError(null);
      setTitle("");
      setBody("");
      setHref("");
      await qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Gagal membuat notifikasi");
    },
  });

  const rows = listQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Admin: Notifikasi</h1>
        <p className="text-sm text-muted-foreground">Kirim inbox notification ke user portal.</p>
      </div>

      <div className="grid gap-3 rounded-md border bg-card p-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Recipient User ID</span>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={recipientUserId} onChange={(e) => setRecipientUserId(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Student ID</span>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Type</span>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Severity</span>
          <select className="w-full rounded-md border px-3 py-2 text-sm" value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="DANGER">DANGER</option>
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs text-muted-foreground">Title</span>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs text-muted-foreground">Body</span>
          <textarea className="min-h-24 w-full rounded-md border px-3 py-2 text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs text-muted-foreground">Href</span>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={href} onChange={(e) => setHref(e.target.value)} placeholder="/portal/student/billing" />
        </label>
        <button
          type="button"
          disabled={createMutation.isPending || !recipientUserId || !title}
          onClick={() => createMutation.mutate()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          Kirim
        </button>
      </div>

      {message ? <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{message}</div> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <DataTable minWidthClassName="min-w-[980px]">
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Created</DataTableHeaderCell>
            <DataTableHeaderCell>Recipient</DataTableHeaderCell>
            <DataTableHeaderCell>Type</DataTableHeaderCell>
            <DataTableHeaderCell>Title</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
            <DataTableHeaderCell>Severity</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <tbody>
          {rows.length === 0 ? (
            <DataTableEmptyRow colSpan={6} message="Belum ada notifikasi." />
          ) : (
            rows.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell>{new Date(row.createdAt).toLocaleString("id-ID")}</DataTableCell>
                <DataTableCell>{row.recipient?.name ?? row.recipient?.email ?? row.id}</DataTableCell>
                <DataTableCell>{row.type}</DataTableCell>
                <DataTableCell>{row.title}</DataTableCell>
                <DataTableCell>{row.status}</DataTableCell>
                <DataTableCell>{row.severity}</DataTableCell>
              </DataTableRow>
            ))
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
