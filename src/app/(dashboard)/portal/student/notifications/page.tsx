"use client";

import { useQuery } from "@tanstack/react-query";

type Noti = { id: string; type: string; title: string; description?: string; href?: string; date?: string; severity?: "info" | "warning" | "danger" };

export default function StudentNotificationsPage() {
  const { data, isFetching } = useQuery<{ items: Noti[] }>({ queryKey: ["portal-notifications"], queryFn: async () => (await fetch("/api/portal/notifications")).json() });
  const items = data?.items ?? [];
  const badge = (sev?: string) => (sev === "danger" ? "bg-red-600" : sev === "warning" ? "bg-amber-500" : "bg-blue-600");
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Notifikasi</h1>
      {isFetching ? (
        <div>Memuat…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">Tidak ada notifikasi.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className="border rounded-md p-3 flex items-start gap-3">
              <span className={`inline-block h-2.5 w-2.5 rounded-full mt-1 ${badge(n.severity)}`}></span>
              <div className="flex-1">
                <div className="font-medium">{n.title}</div>
                {n.description ? <div className="text-sm text-muted-foreground">{n.description}</div> : null}
                {n.href ? (
                  <a href={n.href} className="text-xs text-blue-600 underline">Lihat</a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

