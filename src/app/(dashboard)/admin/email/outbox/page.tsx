"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Row = { id: string; to: string; status: string; providerMsgId?: string | null; sentAt?: string | null; subject?: string | null; template?: { key: string } | null };

export default function EmailOutboxPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const { data, isFetching } = useQuery<{ items: Row[] }>({ queryKey: ["email-outbox", status], queryFn: async () => (await fetch(`/api/admin/email/outbox${status ? `?status=${status}`: ""}`)).json() });

  const send = useMutation({
    mutationFn: async () => { const res = await fetch(`/api/admin/email/outbox/send?limit=50`, { method: "POST" }); if (!res.ok) throw new Error("Send failed"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-outbox"] }),
  });
  const retry = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/admin/email/outbox/${id}/retry`, { method: "POST" }); if (!res.ok) throw new Error("Retry failed"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-outbox"] }),
  });
  const cancel = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/admin/email/outbox/${id}/cancel`, { method: "POST" }); if (!res.ok) throw new Error("Cancel failed"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-outbox"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Admin: Email Outbox</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Status</label>
          <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            {(["", "PENDING", "SENT", "FAILED", "CANCELLED"] as string[]).map((s) => (
              <option key={s || "all"} value={s}>
                {s || "ALL"}
              </option>
            ))}
          </select>
        </div>
        <button className="ml-auto rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" onClick={() => send.mutate()} disabled={send.isPending}>Kirim Pending</button>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">ID</th>
              <th className="text-left p-2 border-b">To</th>
              <th className="text-left p-2 border-b">Template</th>
              <th className="text-left p-2 border-b">Subject</th>
              <th className="text-left p-2 border-b">Status</th>
              <th className="text-left p-2 border-b">Provider ID</th>
              <th className="text-left p-2 border-b">Sent At</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((o) => (
              <tr key={o.id}>
                <td className="p-2 border-b">{o.id}</td>
                <td className="p-2 border-b">{o.to}</td>
                <td className="p-2 border-b">{o.template?.key ?? "-"}</td>
                <td className="p-2 border-b">{o.subject ?? "-"}</td>
                <td className="p-2 border-b">{o.status}</td>
                <td className="p-2 border-b">{o.providerMsgId ?? "-"}</td>
                <td className="p-2 border-b">{o.sentAt ? new Date(o.sentAt).toLocaleString() : "-"}</td>
                <td className="p-2 border-b">
                  {o.status === "FAILED" ? (
                    <button className="text-xs px-2 py-1 rounded border border-amber-600 text-amber-700 mr-2" onClick={() => retry.mutate(o.id)} disabled={retry.isPending}>Retry</button>
                  ) : null}
                  {o.status === "PENDING" ? (
                    <button className="text-xs px-2 py-1 rounded border border-red-600 text-red-700" onClick={() => cancel.mutate(o.id)} disabled={cancel.isPending}>Cancel</button>
                  ) : null}
                </td>
              </tr>
            ))}
            {(data?.items?.length ?? 0) === 0 && (
              <tr><td className="p-2" colSpan={8}>Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
