# DRSIS Technical Standards

## 1. Stack Utama

- Next.js App Router untuk web, dashboard, portal, dan API route.
- React untuk UI interaktif.
- TypeScript strict-oriented.
- Prisma untuk data access.
- PostgreSQL sebagai database utama.
- NextAuth Credentials + JWT untuk auth.
- Zod untuk validation.
- Tailwind CSS v4 dan CSS variables untuk theming.
- Playwright untuk E2E/smoke.

## 2. Database

Canonical local URL:

```bash
DATABASE_URL=postgresql://sis:sis@127.0.0.1:5432/sis?schema=public
```

Rules:

- Migration aktif harus PostgreSQL-compatible.
- Legacy MariaDB migration tidak boleh berada di folder aktif `prisma/migrations`.
- Native type PostgreSQL dipakai jika perlu, misalnya `@db.Text`.
- Hindari raw SQL kecuali benar-benar perlu; jika perlu, pastikan kompatibel PostgreSQL dan dites.
- Finance dan attendance mutation harus transactional jika menyentuh beberapa tabel.

## 3. Folder & Ownership

Pola target:

```text
src/
  app/              # routes, pages, layouts
  components/       # reusable UI
  lib/              # shared infra helpers
  middleware/       # guard helpers
  server/           # domain services
  types/            # shared app types
```

API route target:

```text
src/app/api/<domain>/<resource>/route.ts
```

Domain service target:

```text
src/server/<domain>/<feature>.service.ts
src/server/<domain>/<feature>.dto.ts
src/server/<domain>/<domain>.permissions.ts
```

## 4. API Standards

- REST App Router tetap canonical.
- API route tidak boleh menampung business logic panjang.
- Input wajib divalidasi Zod.
- Response error harus konsisten: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict.
- Mutasi penting harus audit.
- Endpoint baru wajib masuk OpenAPI.
- Public endpoint harus eksplisit, bukan lolos karena default authenticated access.
- Route sensitif baru wajib memakai `requireApiPermission` atau helper domain yang setara.

## 5. Auth & RBAC

- Default route sensitif adalah deny-by-default.
- Permission check lebih penting daripada label role.
- Sidebar/UI gating harus konsisten dengan backend guard.
- Portal endpoint wajib scoped ke session user.
- Cron/webhook harus memakai secret header.
- Presigned upload harus dibatasi role, folder, content type, dan ukuran.

## 6. Audit & Observability

Audit event minimal menyimpan:

- action
- actor user id jika ada
- target entity/id
- metadata penting tanpa data sensitif mentah
- timestamp

Metrics minimal:

- request duration
- error rate
- readiness DB
- readiness config utama
- outbox queue count
- Dapodik sync status

Boundary implementasi awal:

- Notification inbox: `notification_inbox`, `notification.manage`, portal scoped to session user.
- Analytics event/snapshot: `analytics_event`, `analytics_snapshot`, `analytics.read`, `analytics.write`.
- CBT internal: model `Exam`, `ExamQuestion`, `ExamAttempt.answersJson`, `exam.manage`, portal scoped to selected student.
- Dapodik: `DAPODIK_SYNC_MODE=disabled|mock|real`, status endpoint, real connector only with official config.

## 7. Background Jobs

- Cron facade tetap melalui `/api/admin/cron/tick`.
- Job harus idempotent.
- Retry memakai max attempt dan backoff.
- Gagal permanen harus terlihat di UI admin atau log audit.

## 8. UI Standards

- Gunakan shared components untuk button, input, select, table, empty state, page header, pagination, dialog, tabs, badge, alert.
- Jangan membuat pola form/table baru per halaman jika pola sudah ada.
- Halaman dashboard harus responsive minimal mobile, tablet, desktop.
- Public website harus memakai CMS data dan branding sekolah.
- Tidak boleh ada text overflow atau layout pecah di smoke viewport.

## 9. Testing Standards

Minimal sebelum merge:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

Untuk perubahan database:

```bash
npx prisma validate
npm run db:generate
npm run db:seed
```

Untuk perubahan API:

```bash
npm run openapi:gen
```

## 10. Compatibility Policy

- PostgreSQL adalah target utama.
- MariaDB tidak dijamin berjalan sebagai provider runtime setelah migrasi.
- Folder legacy MariaDB hanya untuk audit, referensi, atau migrasi manual di masa depan.
