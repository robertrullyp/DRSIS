"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";

const nav: any[] = [
  { label: "Dashboard", href: "/dashboard" },
  {
    label: "Master Data",
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
    ],
  },
];

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const session = useSession();
  const isAdmin = Array.isArray((session.data?.user as any)?.roles) && (session.data?.user as any).roles.includes("admin");
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] bg-background text-foreground">
      <aside className="border-r border-border bg-card p-4 glass-card">
        <div className="mb-6 font-bold tracking-tight">
          <span className="text-lg">SIS</span>
        </div>
        <nav className="space-y-3">
          {nav.map((item, idx) => (
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
