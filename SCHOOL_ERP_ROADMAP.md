# DRSIS Roadmap

## Fase 0 - PostgreSQL Foundation

Tujuan: menjadikan PostgreSQL database utama tanpa migrasi data lama.

- Selesaikan Prisma provider PostgreSQL.
- Gunakan baseline migration PostgreSQL.
- Seed role, permission, admin, menu, dan data awal.
- Update `.env`, Docker, CI, Playwright, README, dan backup docs.
- Simpan MariaDB sebagai legacy compatibility.

Definition of Done:

- `npx prisma validate` lulus.
- `npm run db:generate` lulus.
- Migration PostgreSQL dapat diterapkan ke database kosong.
- `npm run db:seed` lulus.
- `/api/health/ready` OK.

Status: implemented di working tree.

## Fase 1 - Stabilization & Audit Total

Tujuan: membuktikan seluruh modul yang sudah ada stabil setelah PostgreSQL.

- Jalankan audit Playwright menyeluruh untuk public site, dashboard admin, portal siswa, portal pegawai, PPDB, CMS, finance, HR, library, asset, dan notification.
- Perbaiki regression data query, enum, index, atau unique constraint yang muncul di PostgreSQL.
- Pastikan semua role guard sesuai antara backend dan UI sidebar.
- Pastikan OpenAPI tetap ter-generate.
- Pastikan no-console-error untuk halaman utama.

Definition of Done:

- `npm run lint`, `npx tsc --noEmit`, `npm run build`, dan `npm run test:e2e` lulus.
- Tidak ada endpoint sensitif yang public tanpa guard.
- Tidak ada halaman portal membaca data di luar scope user.

Status awal: guard terpusat `requireApiPermission` sudah diterapkan pada identity, analytics, audit, Dapodik, notification admin, WA/email admin, dan mutasi assessment prioritas.

## Fase 2 - Modernisasi UI & Design System

Tujuan: UI rapi, modern, konsisten, dan nyaman dipakai harian.

- Perkuat komponen UI bersama: button, input, select, table, dialog, badge, tabs, empty state, pagination, toast/alert, form field, page header.
- Rapikan app shell: navigasi role-aware, search/menu cepat, responsive drawer, active state jelas.
- Konsolidasikan pola list/form/detail di modul admin.
- Tingkatkan public website supaya CMS terasa seperti website sekolah modern, bukan dashboard admin yang dipublikkan.
- Audit RWD mobile/tablet/desktop.

Definition of Done:

- Semua halaman utama memakai komponen dan token yang sama.
- Tidak ada overflow mobile di halaman smoke.
- Sidebar/menu tetap usable pada role admin, staff, student, parent, editor.

## Fase 3 - Domain Consolidation

Tujuan: kode lebih mudah dirawat dan siap tumbuh.

- Pindahkan business logic berat dari API route/page ke `src/server/<domain>`.
- Rapikan DTO Zod per domain dan export schema untuk OpenAPI.
- Standarkan audit event taxonomy per domain.
- Standarkan service return shape untuk list pagination, mutation result, dan error.
- Tambahkan helper permission per domain agar guard tidak tersebar acak.

Definition of Done:

- API route hanya melakukan auth, validation, call service, dan response mapping.
- Domain service punya unit-level smoke path atau integration coverage.
- OpenAPI endpoint prioritas lengkap.

## Fase 4 - Gap Feature Completion

Tujuan: menyelesaikan modul yang masih pending.

- Dapodik real connector:
  - finalisasi jalur resmi, credential, scope, mapper, orchestrator, reconciliation, dan monitoring.
- Event-driven analytics:
  - taxonomy event, snapshot harian, materialized reporting, KPI dashboard.
- CBT internal:
  - bank soal, paket ujian, jadwal, attempt peserta, auto grading, hasil ujian, export.
- Notification center:
  - pusat notifikasi user, read/unread, preference dasar, trigger lintas modul.

Status awal:

- Notification inbox v1: persistent inbox, read/archive, admin create/list, portal merge dengan generated notifications.
- Analytics v1: analytics event API dan daily summary snapshot API.
- CBT v1: exam/question API, portal available exams, start/submit attempt, exact-match auto grading.
- Dapodik v1: mock/status/queue/staging boundary; real connector menunggu akses resmi.

Definition of Done:

- Semua modul baru punya data model, UI, API, RBAC, audit, OpenAPI, dan Playwright smoke.

## Fase 5 - Mobile Readiness

Tujuan: menyiapkan React Native/Expo tanpa membelah sistem terlalu cepat.

- Stabilkan API portal siswa/orang tua/pegawai.
- Pastikan session/auth strategy mobile-friendly.
- Tambahkan endpoint profile/scope ringkas.
- Buat mobile API compatibility contract.
- Hindari coupling UI web dengan shape response internal yang tidak terdokumentasi.

Definition of Done:

- Mobile app dapat memakai API tanpa akses database langsung.
- OpenAPI punya group portal/mobile-ready.

## Fase 6 - Production Hardening

Tujuan: siap produksi sekolah nyata.

- Backup/restore drill PostgreSQL + S3.
- Uptime monitor readiness.
- Observability request duration/error rate/correlation id.
- Rate limit endpoint publik.
- Security audit RBAC, session, storage presign, webhook secret, cron secret.
- Runbook deployment, rollback, incident, dan data recovery.

Definition of Done:

- Release checklist punya hasil audit, backup restore proof, dan rollback path.
