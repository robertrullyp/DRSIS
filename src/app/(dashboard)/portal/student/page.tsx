"use client";

import Link from "next/link";
import { PortalStudentScopeBanner, usePortalStudentScope } from "@/components/portal/student-scope";

export default function StudentPortalHome() {
  const { me, isLoading, childScopedUrl, setSelectedChildId } = usePortalStudentScope();

  const links = [
    { href: "/portal/student/schedule", label: "Jadwalku" },
    { href: "/portal/student/grades", label: "Nilai" },
    { href: "/portal/student/report-cards", label: "Raport" },
    { href: "/portal/student/attendance", label: "Presensi" },
    { href: "/portal/student/billing", label: "Tagihan" },
    { href: "/portal/student/savings", label: "Tabungan" },
    { href: "/portal/student/notifications", label: "Notifikasi" },
    { href: "/portal/student/id-card", label: "Kartu Pelajar" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Portal Siswa</h1>
      <p className="text-sm text-muted-foreground">Akses cepat ke informasi akademik pribadi Anda.</p>
      <PortalStudentScopeBanner me={me} isLoading={isLoading} onSelectChild={setSelectedChildId} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {links.map((link) => (
          <Link key={link.href} href={childScopedUrl(link.href)} className="rounded-md border p-4 transition-colors hover:bg-muted">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
