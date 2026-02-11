"use client";

import { PortalStudentScopeBanner, usePortalStudentScope } from "@/components/portal/student-scope";

export default function StudentIdCardPage() {
  const { me, isLoading, childScopedUrl, setSelectedChildId } = usePortalStudentScope();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Kartu Pelajar</h1>
      <p className="text-sm text-muted-foreground">Unduh kartu pelajar dalam format PDF (ukuran kartu CR-80).</p>
      <PortalStudentScopeBanner me={me} isLoading={isLoading} onSelectChild={setSelectedChildId} />
      <div>
        <a
          href={childScopedUrl("/api/portal/student/id-card")}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-accent px-4 py-2 text-accent-foreground hover:opacity-90"
        >
          Lihat / Unduh PDF
        </a>
      </div>
    </div>
  );
}
