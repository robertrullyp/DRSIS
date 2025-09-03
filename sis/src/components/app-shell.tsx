"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

const nav = [
  { label: "Dashboard", href: "/dashboard" },
  {
    label: "Master Data",
    children: [
      { label: "Tahun Ajaran", href: "/master/academic-years" },
      { label: "Tingkat/Kelas", href: "/master/grades" },
      { label: "Semester", href: "/master/semesters" },
      { label: "Kelas", href: "/master/classrooms" },
      { label: "Mata Pelajaran", href: "/master/subjects" },
      { label: "Kurikulum", href: "/master/curricula" },
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
    label: "HR",
    children: [
      { label: "Shift Pegawai", href: "/hr/shifts" },
      { label: "Rekap Absensi", href: "/hr/attendance" },
    ],
  },
];

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r bg-gray-50 p-4">
        <div className="mb-6 font-bold">SIS</div>
        <nav className="space-y-3">
          {nav.map((item) => (
            <div key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                    pathname === item.href ? "bg-gray-200 font-semibold" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <div className="text-xs uppercase text-gray-500 mb-1">
                  {item.label}
                </div>
              )}
              {item.children && (
                <div className="ml-2 space-y-1">
                  {item.children.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                        pathname === c.href ? "bg-gray-200 font-semibold" : ""
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
        <header className="border-b p-4 flex items-center justify-between">
          <div className="font-medium">School Information System</div>
          <div className="text-sm text-gray-500">v0.1</div>
        </header>
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
