"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { useQuery } from "@tanstack/react-query";

type NavChild = { label: string; href: string; adminOnly?: boolean; cmsAccess?: boolean };
type NavItem = { label: string; href?: string; children?: NavChild[] };

const nav: NavItem[] = [
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
      { label: "Audit Log", href: "/admin/audit", adminOnly: true },
      { label: "Analitik", href: "/admin/analytics", adminOnly: true },
      { label: "Devtools", href: "/admin/devtools", adminOnly: true },
      { label: "LMS/CBT Links", href: "/admin/lms/links", adminOnly: true },
      { label: "Integrasi Dapodik", href: "/admin/dapodik", adminOnly: true },
      { label: "CMS Posts", href: "/admin/cms/posts", cmsAccess: true },
      { label: "CMS Events", href: "/admin/cms/events", cmsAccess: true },
      { label: "CMS Pages", href: "/admin/cms/pages", cmsAccess: true },
      { label: "CMS Galleries", href: "/admin/cms/galleries", cmsAccess: true },
      { label: "CMS Menus", href: "/admin/cms/menus", cmsAccess: true },
      { label: "CMS Media", href: "/admin/cms/media", cmsAccess: true },
      { label: "CMS Inbox", href: "/admin/cms/inbox", cmsAccess: true },
      { label: "CMS Settings", href: "/admin/cms/settings", adminOnly: true },
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
      { label: "Beasiswa", href: "/finance/scholarships" },
      { label: "Laporan", href: "/finance/reports" },
      { label: "Tools", href: "/finance/tools" },
      { label: "Operasional: COA", href: "/finance/operational/accounts" },
      { label: "Operasional: Kas/Bank", href: "/finance/operational/cash-bank" },
      { label: "Operasional: Anggaran", href: "/finance/operational/budgets" },
      { label: "Operasional: Transaksi", href: "/finance/operational/transactions" },
      { label: "Operasional: Lock Periode", href: "/finance/operational/period-locks" },
      { label: "Operasional: Laporan", href: "/finance/operational/reports" },
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
    children: [{ label: "Pendaftaran", href: "/ppdb/applications" }],
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
    children: [{ label: "Tiket", href: "/counseling/tickets" }],
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

type School = { name?: string | null; logoSignedUrl?: string | null } | null;
type SessionUser = { roles?: string[]; permissions?: string[] } | undefined;

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const session = useSession();

  const roles = useMemo(() => {
    const user = session.data?.user as SessionUser;
    return Array.isArray(user?.roles) ? user.roles : [];
  }, [session.data?.user]);
  const permissions = useMemo(() => {
    const user = session.data?.user as SessionUser;
    return Array.isArray(user?.permissions) ? user.permissions : [];
  }, [session.data?.user]);

  const isAdmin = roles.includes("admin");
  const canAccessCms = isAdmin || roles.some((r) => ["operator", "editor"].includes(r)) || permissions.some((p) => p.startsWith("cms."));
  const isStudentLike = roles.some((r) => ["student", "parent", "guardian"].includes(r));
  const isStaffLike = roles.some((r) => ["employee", "staff"].includes(r));

  const { data: school } = useQuery<School>({
    queryKey: ["school-profile-nav"],
    queryFn: async () => (await fetch("/api/public/school")).json(),
  });

  const filteredNav = nav.filter(
    (item) =>
      (item.label !== "Portal Siswa" || isStudentLike || isAdmin) &&
      (item.label !== "Portal Pegawai" || isStaffLike || isAdmin) &&
      (item.label !== "Akademik" || isAdmin)
  );

  return (
    <div className="dashboard-main min-h-screen text-foreground">
      <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-card/95 p-4 shadow-xl backdrop-blur-lg transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 lg:shadow-none ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="neo-card mb-4 p-3">
              <div className="flex items-center gap-3">
                {school?.logoSignedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={school.logoSignedUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain bg-white/70 p-1" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-sm font-bold">SIS</div>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Command</p>
                  <p className="truncate text-sm font-semibold">{school?.name || "School Information System"}</p>
                </div>
              </div>
            </div>

            <nav className="space-y-4 overflow-y-auto pr-1">
              {filteredNav.map((item) => {
                const itemIsActive = Boolean(
                  item.href ? pathname === item.href : item.children?.some((child) => pathname === child.href)
                );

                return (
                  <div key={item.label}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`block rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                          itemIsActive
                            ? "border-accent/60 bg-[color-mix(in_oklab,var(--accent)_14%,var(--card))] font-semibold"
                            : "border-transparent hover:border-border hover:bg-muted/70"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ) : item.children ? (
                      (() => {
                        const children = item.children.filter(
                          (child) =>
                            (!child.adminOnly || isAdmin) &&
                            (!child.cmsAccess || canAccessCms)
                        );
                        const hasActiveChild = children.some((child) => pathname === child.href);
                        const isCollapsed = collapsedSections[item.label] ?? false;
                        const isOpen = hasActiveChild || !isCollapsed;

                        return (
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                setCollapsedSections((prev) => ({ ...prev, [item.label]: isOpen }))
                              }
                              className={`mb-2 flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-[11px] uppercase tracking-[0.14em] transition-colors ${
                                hasActiveChild
                                  ? "border-accent/40 bg-[color-mix(in_oklab,var(--accent)_8%,var(--card))] text-foreground"
                                  : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/60"
                              }`}
                              aria-expanded={isOpen}
                            >
                              <span>{item.label}</span>
                              <svg
                                viewBox="0 0 20 20"
                                className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path d="M4 7l6 6 6-6" />
                              </svg>
                            </button>

                            {isOpen ? (
                              <div className="space-y-1.5">
                                {children.map((child) => (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={() => setMenuOpen(false)}
                                    className={`block rounded-lg border px-3 py-2 text-sm transition-colors ${
                                      pathname === child.href
                                        ? "border-accent/60 bg-[color-mix(in_oklab,var(--accent)_14%,var(--card))] font-semibold"
                                        : "border-transparent hover:border-border hover:bg-muted/70"
                                    }`}
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })()
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {isMenuOpen ? (
          <button
            type="button"
            aria-label="Tutup menu"
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-lg sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card lg:hidden"
                  onClick={() => setMenuOpen((current) => !current)}
                  aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
                >
                  {isMenuOpen ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M3 12h18M3 18h18" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Campus Command Center</p>
                  <p className="truncate text-base font-medium">School Information System</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <ThemeToggle />
                {session.data?.user ? (
                  <>
                    <Link href="/profile" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/80">
                      Profil Saya
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/80"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/dashboard" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/80">
                    Masuk
                  </Link>
                )}
              </div>
            </div>
          </header>

          <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
