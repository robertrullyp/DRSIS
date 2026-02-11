"use client";

import { useQuery } from "@tanstack/react-query";
import { PortalStudentScopeBanner, usePortalStudentScope } from "@/components/portal/student-scope";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  description?: string;
  href?: string;
  date?: string;
  severity?: "info" | "warning" | "danger";
};

export default function StudentNotificationsPage() {
  const { me, isLoading, selectedChildId, childScopedUrl, setSelectedChildId } = usePortalStudentScope();

  const { data, isFetching } = useQuery<{ items: NotificationItem[] }>({
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
                <div className="font-medium">{item.title}</div>
                {item.description ? <div className="text-sm text-muted-foreground">{item.description}</div> : null}
                {item.href ? (
                  <a href={childScopedUrl(item.href)} className="text-xs text-accent underline">Lihat</a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
