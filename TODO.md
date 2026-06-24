# DRSIS Build Checklist

Checklist ini adalah acuan kerja harian pembangunan DRSIS. Dokumen arsitektur tetap menjadi sumber keputusan utama; file ini menerjemahkannya menjadi daftar kerja yang bisa dicentang bertahap.

## Sumber Rujukan

- [SCHOOL_ERP_MASTER_PLAN.md](SCHOOL_ERP_MASTER_PLAN.md) - visi produk, current state, target architecture.
- [SCHOOL_ERP_ROADMAP.md](SCHOOL_ERP_ROADMAP.md) - fase pembangunan dan Definition of Done.
- [SCHOOL_ERP_MODULES.md](SCHOOL_ERP_MODULES.md) - status modul, gap, role, dan data scope.
- [SCHOOL_ERP_TECHNICAL_STANDARDS.md](SCHOOL_ERP_TECHNICAL_STANDARDS.md) - standar implementasi teknis.
- [SCHOOL_ERP_AUDIT_QA_PLAN.md](SCHOOL_ERP_AUDIT_QA_PLAN.md) - checklist audit, QA, dan release gate.
- [README.md](README.md) - setup lokal, script, dan struktur project.
- [docs/BACKUP.md](docs/BACKUP.md) dan [docs/DAPODIK.md](docs/DAPODIK.md) - runbook operasional khusus.
- [docs/archive/TODO_HISTORY.md](docs/archive/TODO_HISTORY.md) - checklist historis sebelum perombakan plan.

## Cara Pakai Checklist

- Update status hanya setelah perubahan sudah masuk repo dan quality gate terkait lulus.
- Gunakan `[x]` untuk selesai, `[ ]` untuk belum selesai, dan catatan singkat untuk status partial.
- Jangan menjadikan TODO ini sebagai spesifikasi tunggal; detail teknis tetap mengikuti dokumen `SCHOOL_ERP_*.md`.
- Setiap endpoint baru atau endpoint yang disentuh wajib mengikuti pola thin route, Zod validation, service layer, RBAC, audit event untuk mutasi penting, dan OpenAPI.
- Setiap pekerjaan lintas modul harus dicek terhadap data scope portal, public CMS published-only, dan permission deny-by-default.

## P0 - Foundation Lock

- [x] Pastikan stack utama tetap Next.js 15 + React 19 + TypeScript.
- [x] Pastikan Prisma memakai provider `postgresql`.
- [x] Pastikan PostgreSQL menjadi database utama di README, `.env.example`, Docker, Playwright, CI, dan docs.
- [x] Simpan MariaDB hanya sebagai legacy compatibility, bukan runtime default.
- [x] Pertahankan baseline migration PostgreSQL untuk fresh database.
- [x] Pertahankan seed role, permission, admin, menu, dan data awal.
- [x] Pertahankan Docker PostgreSQL untuk dev/E2E portable.
- [x] Pertahankan OpenAPI generator sebagai kontrak API internal.
- [ ] Ganti CI database setup production-like dari `prisma db push --accept-data-loss` ke `prisma migrate deploy` jika masih dipakai untuk quality gate utama.
- [ ] Pastikan `npm run test:e2e` selesai di PostgreSQL E2E tanpa memakai database lokal produksi.

## P1 - Plan & Repo Relevance Audit

- [x] Jadikan `SCHOOL_ERP_MASTER_PLAN.md` sumber arah arsitektur utama.
- [x] Jadikan `SCHOOL_ERP_ROADMAP.md` roadmap fase pembangunan.
- [x] Jadikan `SCHOOL_ERP_MODULES.md` matrix status modul dan gap.
- [x] Jadikan `SCHOOL_ERP_TECHNICAL_STANDARDS.md` standar teknis implementasi.
- [x] Jadikan `SCHOOL_ERP_AUDIT_QA_PLAN.md` quality gate dan audit checklist.
- [x] Arsipkan TODO lama ke `docs/archive/TODO_HISTORY.md`.
- [x] Pindahkan referensi besar `School_ERP_Architecture_Plan.docx` ke `docs/reference/`.
- [x] Hapus artefak `*:Zone.Identifier`.
- [x] Pastikan `.gitignore` tidak mengabaikan `TODO.md` sebagai checklist utama.
- [ ] Audit ulang link internal README, docs, dan plan setiap kali file dipindahkan.
- [ ] Rapikan struktur docs lanjutan: `docs/reference`, `docs/archive`, dan folder operasional jika dokumen makin banyak.
- [ ] Standarkan ownership folder source: `src/app`, `src/server/<domain>`, `src/lib/schemas`, `tests`, dan `docs`.

## P2 - Stabilization & Security Audit

- [x] Terapkan helper guard API terpusat untuk route sensitif prioritas.
- [x] Terapkan guard prioritas pada identity, analytics, audit, Dapodik, notification admin, WA/email admin, dan mutasi assessment.
- [ ] Audit seluruh route API yang belum jelas guard/permission-nya.
- [ ] Pastikan semua route admin/domain sensitif memakai permission eksplisit.
- [ ] Pastikan portal siswa hanya membaca data siswa aktif atau anak yang terhubung.
- [ ] Pastikan portal pegawai hanya membaca data pegawai aktif.
- [ ] Pastikan public CMS hanya mengekspos konten `PUBLISHED` dan `publishedAt <= now`.
- [ ] Pastikan error response tidak membocorkan data sensitif.
- [ ] Tambahkan audit event untuk mutasi domain penting yang belum tercatat.
- [ ] Pastikan OpenAPI mencakup endpoint baru dan endpoint prioritas.

## P3 - UI Modernization

- [x] Pertahankan sistem tema token-based, light/dark/system, dan branding sekolah.
- [x] Pertahankan app shell dashboard dengan sidebar role-aware dan responsive drawer.
- [ ] Konsolidasikan komponen UI bersama: button, input, select, table, dialog, badge, tabs, empty state, pagination, toast/alert, form field, dan page header.
- [ ] Rapikan pola list/form/detail untuk modul admin.
- [ ] Rapikan portal siswa/orang tua agar notifikasi, CBT, tagihan, nilai, presensi, dan raport punya UX konsisten.
- [ ] Rapikan portal pegawai untuk check-in/out, timesheet, cuti/izin, dan status workflow.
- [ ] Rapikan public CMS agar terasa sebagai website sekolah modern, bukan dashboard admin.
- [ ] Audit responsive behavior mobile, tablet, desktop untuk halaman utama.
- [ ] Pastikan tidak ada overflow teks/tabel pada smoke viewport Playwright.

## P4 - Domain Consolidation

- [ ] Pastikan API route hanya menangani auth, validation, call service, dan response mapping.
- [ ] Pindahkan business logic berat ke `src/server/<domain>`.
- [ ] Standarkan DTO domain di `src/server/<domain>` dan schema lintas route di `src/lib/schemas`.
- [ ] Standarkan audit event taxonomy per domain.
- [ ] Standarkan pagination, mutation result, dan error shape untuk API baru.
- [ ] Tambahkan helper permission per domain agar guard tidak tersebar acak.
- [ ] Konsolidasikan domain Identity, Academic, HR, Portals, Admission, Finance, Content, Services, Communication, Integration, dan Governance sesuai master plan.

## P5 - Feature Completion

- [x] Notification inbox v1: persistent inbox, read/archive, admin create/list, dan portal merge dengan generated notifications.
- [ ] Lengkapi notification center dengan preference user, trigger lintas modul, dan audit event konsisten.
- [x] Analytics v1: analytics event API dan daily summary snapshot API.
- [ ] Lengkapi analytics dengan event taxonomy final, materialized reporting, dashboard event detail, dan snapshot harian performa.
- [x] CBT internal v1: exam/question API, portal available exams, start/submit attempt, dan exact-match auto grading.
- [ ] Lengkapi CBT dengan bank soal lanjutan, paket ujian, jadwal, attempt monitoring, hasil ujian, export, dan laporan.
- [x] Dapodik v1: mock/status/queue/staging boundary.
- [ ] Implement real Dapodik connector hanya setelah jalur resmi, credential, scope, mapper, orchestrator, dan kebijakan data jelas.
- [ ] Tambahkan Playwright smoke untuk notification center, analytics, CBT, dan Dapodik boundary.

## P6 - Mobile Readiness

- [ ] Stabilkan API portal siswa/orang tua/pegawai untuk konsumsi React Native/Expo nanti.
- [ ] Tetapkan response envelope dan error shape untuk endpoint mobile-ready.
- [ ] Tetapkan pagination/filter/search contract untuk list endpoint portal.
- [ ] Tambahkan endpoint profile/scope ringkas untuk mobile session bootstrap.
- [ ] Pastikan mobile app masa depan tidak perlu membaca database langsung.
- [ ] Pastikan OpenAPI punya grouping portal/mobile-ready yang mudah dipakai client.

## P7 - Production Hardening

- [x] Readiness endpoint memvalidasi DB connectivity dan konfigurasi runtime utama.
- [x] Backup PostgreSQL dan S3/MinIO terdokumentasi.
- [ ] Jalankan dan dokumentasikan restore drill PostgreSQL + S3/MinIO.
- [ ] Tambahkan env validation yang gagal cepat untuk konfigurasi produksi wajib.
- [ ] Rapikan deployment checklist, rollback checklist, dan incident/data recovery runbook.
- [ ] Pastikan webhook secret, cron secret, storage presign, dan rate limit endpoint publik diaudit.
- [ ] Pastikan observability request duration, error rate, correlation id, dan uptime monitor tercatat.
- [ ] Evaluasi `next.config.ts` agar `ignoreDuringBuilds` dan `ignoreBuildErrors` tidak menjadi kebiasaan production gate.

## P8 - Audit & Release Gate

- [ ] `git diff --check` lulus.
- [ ] Link internal Markdown README, TODO, docs, dan `SCHOOL_ERP_*.md` valid.
- [ ] `npx prisma validate` lulus.
- [ ] `npm run db:generate` lulus.
- [ ] Fresh PostgreSQL migrate + seed lulus.
- [ ] `npm run openapi:gen` lulus dan contract tidak stale.
- [ ] `npm run lint` lulus.
- [ ] `npx tsc --noEmit` lulus.
- [ ] `DATABASE_URL=postgresql://... npm run build` lulus.
- [ ] `npm run test:e2e` lulus dengan PostgreSQL E2E.
- [ ] Playwright audit mencakup auth/RBAC, public CMS, PPDB, portal siswa/orang tua, portal pegawai, finance, library, assets, notifications, analytics, CBT, Dapodik mock, RWD, dan no-console-error.
- [ ] Backup-restore drill punya bukti hasil.
