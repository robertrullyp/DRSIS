"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { useQuery } from "@tanstack/react-query";

const nav: any[] = [
  { label: "Dashboard", href: "/dashboard" },
  {
    label: "Portal Siswa",
    children: [
      { label: "Jadwalku", href: "/portal/student/schedule" },
      { label: "Nilai", href: "/portal/student/grades" },
      { label: "Raport", href: "/portal/student/report-cards" },
      { label: "Presensi", href: "/portal/student/attendance" },
      { label: "Tagihan", href: "/portal/student/billing" },
      { label: "Tabungan", href: "/portal/student/savings" },
      { label: "Notifikasi", href: "/portal/student/notifications" },
      { label: "Kartu Pelajar", href: "/portal/student/id-card" },
    ],
  },
  {
    label: "Akademik",
    children: [
      { label: "Tahun Ajaran", href: "/master/academic-years" },
      { label: "Tingkat/Kelas", href: "/master/grades" },
      { label: "Semester", href: "/master/semesters" },
      { label: "Kelas", href: "/master/classrooms" },
      { label: "Jadwal", href: "/master/schedules" },
      { label: "Mata Pelajaran", href: "/master/subjects" },
      { label: "Kurikulum", href: "/master/curricula" },
      { label: "Guru", href: "/master/teachers" },
      { label: "Siswa", href: "/master/students" },
      { label: "Enrollments", href: "/master/enrollments" },
      { label: "Profil Sekolah", href: "/master/school", adminOnly: true },
    ],
  },
  {
    label: "Absensi",
    children: [
      { label: "Absensi Siswa", href: "/attendance/student" },
      { label: "Absensi Pegawai", href: "/attendance/staff" },
    ],
  },
  {
    label: "Penilaian",
    children: [
      { label: "Input Nilai", href: "/assessment" },
      { label: "Raport", href: "/report-cards" },
    ],
  },
  {
    label: "Admin",
    children: [
      { label: "Users & Roles", href: "/admin/users" },
      { label: "Roles & Permissions", href: "/admin/roles" },
      { label: "Devtools", href: "/admin/devtools", adminOnly: true },
      { label: "WA Outbox", href: "/admin/wa/outbox", adminOnly: true },
      { label: "WA Templates", href: "/admin/wa/templates", adminOnly: true },
      { label: "Email Outbox", href: "/admin/email/outbox", adminOnly: true },
      { label: "Email Templates", href: "/admin/email/templates", adminOnly: true },
    ],
  },
  {
    label: "Keuangan",
    children: [
      { label: "Aturan Biaya", href: "/finance/fee-rules" },
      { label: "Tagihan", href: "/finance/invoices" },
    ],
  },
  {
    label: "Tabungan",
    children: [
      { label: "Akun", href: "/savings/accounts" },
      { label: "Transaksi", href: "/savings/transactions" },
    ],
  },
  {
    label: "PPDB",
    children: [
      { label: "Pendaftaran", href: "/ppdb/applications" },
    ],
  },
  {
    label: "Perpustakaan",
    children: [
      { label: "Katalog", href: "/library/items" },
      { label: "Anggota", href: "/library/members" },
      { label: "Pinjam/Kembali", href: "/library/loans" },
      { label: "Barcodes", href: "/library/barcodes" },
      { label: "Pengaturan", href: "/library/settings" },
    ],
  },
  {
    label: "Aset",
    children: [
      { label: "Kategori", href: "/assets/categories" },
      { label: "Inventaris", href: "/assets/inventory" },
      { label: "Peminjaman", href: "/assets/loans" },
      { label: "Perawatan", href: "/assets/maintenance" },
      { label: "Laporan Depresiasi", href: "/assets/reports/depreciation" },
    ],
  },
  {
    label: "Ekstrakurikuler",
    children: [
      { label: "Kegiatan", href: "/extras/extracurriculars" },
      { label: "Anggota", href: "/extras/members" },
      { label: "Presensi", href: "/extras/attendance" },
      { label: "Event", href: "/extras/events" },
    ],
  },
  {
    label: "BK/Konseling",
    children: [
      { label: "Tiket", href: "/counseling/tickets" },
    ],
  },
  {
    label: "Admin",
    children: [
      { label: "Users & Roles", href: "/admin/users" },
    ],
  },
  {
    label: "HR",
    children: [
      { label: "Shift Pegawai", href: "/hr/shifts" },
      { label: "Rekap Absensi", href: "/hr/attendance" },
      { label: "Timesheet", href: "/hr/timesheets" },
      { label: "Pengajuan Cuti/Izin", href: "/hr/leaves" },
      { label: "Tipe Cuti/Izin", href: "/hr/leave-types" },
    ],
  },
  {
    label: "Portal Pegawai",
    children: [
      { label: "Check-in/Out", href: "/portal/staff/checkin" },
      { label: "Timesheet Saya", href: "/portal/staff/timesheet" },
      { label: "Cuti/Izin Saya", href: "/portal/staff/leaves" },
    ],
  },
];

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const session = useSession();
  const roles = (Array.isArray((session.data?.user as any)?.roles) ? (session.data?.user as any).roles : []) as string[];
  const isAdmin = roles.includes("admin");
  const isStudentLike = roles.some((r) => ["student", "parent", "guardian"].includes(r));
  type School = { name?: string | null; logoSignedUrl?: string | null } | null;
  const { data: school } = useQuery<School>({ queryKey: ["school-profile-nav"], queryFn: async () => (await fetch("/api/public/school")).json() });
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] bg-background text-foreground">
      <aside className="border-r border-border bg-card p-4 glass-card">
        <div className="mb-6 font-bold tracking-tight flex items-center gap-2">
          {school?.logoSignedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoSignedUrl} alt="Logo" className="h-8 w-8 rounded-sm object-contain bg-white/50" />
          ) : (
            <span className="text-lg">🏫</span>
          )}
          <span className="text-lg">{school?.name || "SIS"}</span>
        </div>
        <nav className="space-y-3">
          {nav
            // Hide student/staff portal groups unless eligible; hide Akademik from non-admin
            .filter((item) => (item.label !== "Portal Siswa" || isStudentLike || isAdmin)
              && (item.label !== "Portal Pegawai" || roles.includes("employee") || isAdmin)
              && (item.label !== "Akademik" || isAdmin))
            .map((item, idx) => (
            <div key={item.href ?? `${item.label}-${idx}`}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={`block px-2 py-1 rounded hover:bg-muted transition-colors ${
                    pathname === item.href ? "bg-muted font-semibold border-l-2 border-accent" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <div className="text-xs uppercase text-muted-foreground mb-1">
                  {item.label}
                </div>
              )}
              {item.children && (
                <div className="ml-2 space-y-1">
                  {(item.children as any)
                    .filter((c: any) => !c.adminOnly || isAdmin)
                    .map((c: any) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      className={`block px-2 py-1 rounded hover:bg-muted transition-colors ${
                        pathname === c.href ? "bg-muted font-semibold border-l-2 border-accent" : ""
                      }`}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
      <main>
        <header className="border-b border-border p-4 flex items-center justify-between bg-card glass-card sticky top-0 z-10">
          <div className="font-medium">School Information System</div>
          <div className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            {session.data?.user && (
              <Link href="/profile" className="hover:underline">
                Profil Saya
              </Link>
            )}
            {session.data?.user ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1 rounded border border-border hover:bg-muted"
              >
                Logout
              </button>
            ) : (
              <Link href="/dashboard" className="px-3 py-1 rounded border border-border hover:bg-muted">
                Masuk
              </Link>
            )}
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
