"use client";

import { useQuery } from "@tanstack/react-query";
import { PortalStudentScopeBanner, usePortalStudentScope } from "@/components/portal/student-scope";

type NotificationItem = {
  id: string;
  source?: "inbox" | "generated";
  type: string;
  title: string;
  description?: string;
  href?: string;
  date?: string;
  severity?: "info" | "warning" | "danger";
  status?: "UNREAD" | "READ" | "ARCHIVED";
};

export default function StudentNotificationsPage() {
  const { me, isLoading, selectedChildId, childScopedUrl, setSelectedChildId } = usePortalStudentScope();

  const { data, isFetching, refetch } = useQuery<{ items: NotificationItem[] }>({
    queryKey: ["portal-notifications", selectedChildId],
    enabled: Boolean(me?.student),
    queryFn: async () => {
      const res = await fetch(childScopedUrl("/api/portal/notifications"));
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: NotificationItem[] };
    },
  });

  const items = data?.items ?? [];
  const badgeClass = (severity?: string) => (severity === "danger" ? "bg-red-600" : severity === "warning" ? "bg-amber-500" : "bg-accent");

  async function markRead(id: string) {
    const res = await fetch(`/api/portal/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "READ" }),
    });
    if (res.ok) await refetch();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Notifikasi</h1>
      <PortalStudentScopeBanner me={me} isLoading={isLoading} onSelectChild={setSelectedChildId} />
      {isFetching ? (
        <div>Memuat...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">Tidak ada notifikasi.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 rounded-md border p-3">
              <span className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${badgeClass(item.severity)}`}></span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium">{item.title}</div>
                  {item.status === "UNREAD" ? (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">Baru</span>
                  ) : null}
                </div>
                {item.description ? <div className="text-sm text-muted-foreground">{item.description}</div> : null}
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {item.href ? (
                    <a href={childScopedUrl(item.href)} className="text-accent underline">Lihat</a>
                  ) : null}
                  {item.source === "inbox" && item.status === "UNREAD" ? (
                    <button type="button" onClick={() => markRead(item.id)} className="text-muted-foreground underline">
                      Tandai dibaca
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
