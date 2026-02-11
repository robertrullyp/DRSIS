"use client";

import Link from "next/link";

export default function StudentPortalHome() {
  const links = [
    { href: "/portal/student/schedule", label: "Jadwalku" },
    { href: "/portal/student/grades", label: "Nilai" },
    { href: "/portal/student/report-cards", label: "Raport" },
    { href: "/portal/student/attendance", label: "Presensi" },
    { href: "/portal/student/billing", label: "Tagihan" },
    { href: "/portal/student/savings", label: "Tabungan" },
    { href: "/portal/student/notifications", label: "Notifikasi" },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Portal Siswa</h1>
      <p className="text-sm text-muted-foreground">Akses cepat ke informasi akademik pribadi Anda.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-md border p-4 transition-colors hover:bg-muted">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
