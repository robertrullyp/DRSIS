# DRSIS Audit & QA Plan

## 1. Quality Gate

Gate wajib:

```bash
npx prisma validate
npm run db:generate
npm run db:seed
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

Gate dokumentasi:

```bash
git diff --check
```

## 2. PostgreSQL Audit

- Prisma provider `postgresql`.
- Tidak ada `@db.LongText`.
- Tidak ada migration MySQL aktif di `prisma/migrations`.
- Baseline migration PostgreSQL bisa diterapkan ke database kosong.
- Seed membuat admin default, roles, permissions, dan data awal.
- CI memakai service PostgreSQL.
- E2E memakai PostgreSQL test database.
- Backup docs memakai `pg_dump` dan `pg_restore`.

## 3. Security Audit

- Unauthenticated user diarahkan ke `/sign-in` untuk dashboard.
- Authenticated user tanpa permission mendapat `403`.
- `/api/public/*`, `/api/health`, dan auth route tetap public sesuai kebutuhan.
- `/api/admin/*`, finance, master, HR, portal, storage, CMS admin, Dapodik, notification admin, dan cron terproteksi.
- Webhook public memakai secret jika dikonfigurasi.
- Cron tick memakai `CRON_SECRET`.
- Presigned storage tidak bisa dipakai anonymous untuk folder sensitif.

## 4. Functional Smoke Scenarios

Public:

- Home publik load tanpa error.
- Berita list/detail.
- Agenda list/detail.
- Galeri list/detail.
- Page CMS `/p/[slug]`.
- Kontak submit dengan anti-spam.
- PPDB apply/status/announcement.

Admin:

- Login admin.
- Dashboard.
- Users & roles.
- Audit log.
- Analytics.
- CMS posts/events/pages/galleries/media/menus/settings/inbox.
- PPDB applications.
- Master academic data.
- HR attendance/leaves/shifts/timesheets.
- Finance invoices/reports/operational reports.
- Savings accounts/transactions.
- Library catalog/loans/barcodes/settings.
- Assets inventory/loan/maintenance/depreciation report.
- Extras and counseling.
- LMS links.
- Dapodik batches/staging mock.
- WA/email outbox/templates.
- Notification inbox admin create/list.
- CBT exam/question API and portal submit flow.
- Analytics events/snapshots.

Portal:

- Student schedule, grades, report cards, attendance, billing, savings, notification, ID card.
- Student CBT list/start/submit.
- Parent/guardian child scope.
- Staff check-in/out, timesheet, leaves.

## 5. Data Integrity Checks

- Unique identity: email, NIS/NISN, employee/user links.
- Enrollment unique per academic year.
- Attendance unique per date/schedule.
- Invoice net total respects discount/refund.
- Savings balance follows approved transactions.
- Operational finance period lock blocks mutation.
- Library availability changes after borrow/return.
- Asset status changes after borrow/return/maintenance.
- CMS public queries only return published content.

## 6. RWD & UI QA

Viewport minimal:

- Mobile portrait.
- Tablet.
- Desktop.

Checks:

- Sidebar/drawer usable.
- Table scroll or responsive layout tidak merusak halaman.
- Form controls tidak overflow.
- Public header/footer usable.
- Theme toggle tidak merusak contrast.
- Tidak ada console error utama.

## 7. Backup & Restore Drill

- Jalankan `pg_dump` pada database staging.
- Restore ke database staging baru.
- Jalankan `npx prisma migrate status`.
- Jalankan smoke login dan dashboard.
- Verifikasi object storage dapat dipulihkan dari mirror backup.

## 8. Release Checklist

- Semua quality gate lulus.
- Migration diterapkan di staging.
- Seed idempotent.
- OpenAPI ter-generate.
- Backup terbaru tersedia.
- Rollback path jelas.
- Known issue ditulis di release note.
