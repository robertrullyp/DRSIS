# DRSIS Module Matrix

## Status Legend

- `Implemented`: sudah ada di repo dan punya UI/API utama.
- `Partial`: fondasi ada, masih butuh penyelesaian.
- `Planned`: belum menjadi modul lengkap.

| Domain | Modul | Status | Gap Utama |
| --- | --- | --- | --- |
| Core Platform | Auth, JWT session, RBAC, middleware guard | Implemented | Audit total permission coverage pasca PostgreSQL |
| Core Platform | User, role, permission management | Implemented | Fine-grained permission UX |
| Core Platform | OpenAPI, Zod validation | Implemented | Lengkapi schema endpoint baru |
| Core Platform | PostgreSQL + Prisma | Implemented target | Validasi baseline, seed, CI, E2E |
| Core Platform | S3/MinIO storage | Implemented | Storage lifecycle dan malware/file policy opsional |
| Academic | Master data akademik | Implemented | Import/export dan bulk operation |
| Academic | Penilaian dan raport PDF | Implemented | Approval/report card workflow lebih formal |
| Attendance | Absensi siswa | Implemented | Dynamic QR/geofencing siswa jika dibutuhkan |
| Attendance | Absensi pegawai, shift, timesheet | Implemented | Registered device dan anti-fraud policy |
| HR | Employee, cuti/izin, dinas/pelatihan | Implemented | Calendar integration dan balance cuti |
| Portal | Portal siswa/orang tua | Implemented | Mobile API contract dan push notification |
| Portal | Portal pegawai | Implemented | Offline/mobile check-in future |
| Admission | PPDB publik/admin | Implemented | Ranking/reporting lanjutan |
| CMS | Berita, artikel, agenda, galeri, page, menu, SEO | Implemented | Editorial UX polish dan media optimization |
| Finance | Billing, payment, receipt, discount, scholarship, refund | Implemented | Payment gateway production adapter |
| Finance | Tabungan siswa | Implemented | Buku tabungan PDF/export lanjutan |
| Finance | Operational finance, COA, cash/bank, budget | Implemented | Periodic close dan audit finance lebih formal |
| Library | Catalog, member, loan, return, fine, barcode | Implemented | Scan UX dan inventory import |
| Assets | Registry, loan, maintenance, depreciation | Implemented | Lifecycle procurement/disposal |
| Extras | Extracurricular member, attendance, event | Implemented | Student achievement portfolio |
| Counseling | Ticket, session, referral | Implemented | Privacy policy dan restricted notes |
| Communication | WA/email templates, outbox, webhook, retry, notification inbox | Partial | Preference/trigger lintas modul |
| Analytics | KPI summary, timeseries, finance, event log, snapshot | Partial | Materialized reporting dan dashboard event detail |
| Integration | LMS/CBT link, score import, CBT internal v1 | Partial | Export hasil dan paket ujian lanjutan |
| Integration | Dapodik sync foundation, mock/status adapter boundary | Partial | Real connector dan mapping resmi |
| Governance | Audit log, metrics, readiness config check, backup | Implemented | Full system audit dan restore drill proof |

## Cross-Cutting Requirements

Setiap modul baru atau perombakan modul lama wajib punya:

- Data model Prisma dan migration PostgreSQL.
- Zod schema untuk input.
- REST API route yang tipis.
- Service/domain layer untuk business logic.
- RBAC dan permission mapping.
- Audit event untuk mutasi penting.
- OpenAPI documentation.
- UI list/form/detail sesuai design system.
- Smoke test Playwright untuk workflow utama.

## Role Scope Awal

| Role | Scope |
| --- | --- |
| admin | Semua modul dan konfigurasi |
| operator | Operasional sekolah non-finance sensitif sesuai permission |
| editor | CMS content workflow |
| teacher | Akademik, absensi siswa, penilaian sesuai assignment |
| staff/employee | Portal pegawai, timesheet, cuti/izin |
| finance | Billing, payment, savings, finance reports |
| librarian | Perpustakaan |
| student | Portal data diri sendiri |
| parent/guardian | Portal anak yang terhubung |

## Data Scope Rules

- Admin bisa lintas data sekolah.
- Teacher hanya melihat data akademik yang menjadi tanggung jawabnya kecuali diberi permission tambahan.
- Student hanya data dirinya sendiri.
- Parent/guardian hanya data anak yang terhubung di `StudentGuardian`.
- Staff hanya data kepegawaiannya sendiri di portal.
- Public CMS hanya konten published.
