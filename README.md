# DRSIS — School Information System

DRSIS adalah Sistem Informasi Sekolah berbasis Next.js App Router, Prisma, PostgreSQL, NextAuth JWT RBAC, Tailwind v4, React Query, dan integrasi S3/MinIO.

## Tech Stack

- Next.js 15 (App Router + Turbopack)
- TypeScript
- Prisma + PostgreSQL
- NextAuth (Credentials, JWT)
- Tailwind CSS v4
- React Query
- Playwright (E2E smoke tests)

## Quick Start

### Prasyarat

- Node.js 18+
- PostgreSQL 16 lokal aktif di `localhost:5432`
- Docker (opsional, untuk MinIO)

### Setup lokal

```bash
cp .env.example .env
npm install
# opsional: jalankan MinIO via Docker
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

### Konfigurasi `.env` penting

- Wajib:
  - `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
  - `DATABASE_URL`
  - `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`
- Direkomendasikan:
  - `E2E_DATABASE_URL` (agar Playwright tidak salah target DB)
  - `CRON_SECRET`, `OUTBOX_MAX_ATTEMPTS`
- Opsional:
  - `WA_PROVIDER`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - `HR_TOLERANCE_MINUTES`, `HR_CORE_START`, `HR_CORE_END`
  - `QR_PROVIDER_URL`
  - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`

### Default admin

- Email: `admin@sis.local`
- Password: `admin123`

## Database Lokal

PostgreSQL adalah database utama. Default koneksi lokal:

```bash
DATABASE_URL=postgresql://sis:sis@127.0.0.1:5432/sis?schema=public
```

Jika PostgreSQL system service belum punya database/user `sis`, buat dengan akun admin PostgreSQL:

```bash
sudo -u postgres psql
CREATE ROLE sis LOGIN PASSWORD 'sis';
CREATE DATABASE sis OWNER sis;
\q
```

Docker PostgreSQL tetap tersedia sebagai fallback dev/e2e:

```bash
npm run db:up:docker
# lalu pakai port Docker fallback:
DATABASE_URL=postgresql://sis:sis@127.0.0.1:5433/sis?schema=public
```

MariaDB hanya disimpan sebagai legacy compatibility dan tidak menjadi runtime default.

## Service Lokal

- PostgreSQL system service: `localhost:5432` (mengikuti `DATABASE_URL` di `.env`)
- PostgreSQL Docker fallback: `localhost:5433`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`
  - user: `minioadmin`
  - password: `minioadmin`

## Scripts Penting

- `npm run dev` - jalankan development server
- `npm run build` - build production
- `npm run start` - jalankan hasil build
- `npm run lint` - jalankan ESLint
- `npm run db:up` - nyalakan MinIO via Docker
- `npm run db:up:docker` - nyalakan PostgreSQL Docker fallback + MinIO
- `npm run db:down` - matikan MinIO Docker
- `npm run db:e2e:up` - nyalakan PostgreSQL E2E di port `5433`
- `npm run db:e2e:down` - matikan PostgreSQL E2E
- `npm run db:generate` - generate Prisma Client
- `npm run db:migrate` - jalankan migration development
- `npm run db:push` - sinkronkan schema ke database tanpa migration baru
- `npm run db:seed` - seed role, permission, dan admin
- `npm run openapi:gen` - generate `openapi/openapi.json`
- `npm run test:e2e` - jalankan Playwright tests

Catatan E2E:
- Playwright default memakai `E2E_DATABASE_URL`, fallback ke `DATABASE_URL` (default PostgreSQL port `5433` untuk E2E Docker).
- Pastikan DB target untuk E2E boleh ditulis (karena `prisma db push` + seed berjalan saat setup test).

## Plan Arsitektur

Dokumentasi perombakan dan arah pengembangan utama:

- `SCHOOL_ERP_MASTER_PLAN.md` - visi produk, current-state, dan target architecture
- `SCHOOL_ERP_ROADMAP.md` - roadmap bertahap
- `SCHOOL_ERP_MODULES.md` - matrix domain/modul dan gap
- `SCHOOL_ERP_TECHNICAL_STANDARDS.md` - standar teknis implementasi
- `SCHOOL_ERP_AUDIT_QA_PLAN.md` - checklist audit, QA, dan release gate
- `TODO.md` - checklist aktif pembangunan sistem, diturunkan dari dokumen plan di atas

## Struktur Project

```text
.
├── docs/                     # dokumentasi operasional, arsip, dan referensi
├── prisma/                   # schema + seed
├── public/                   # static assets
├── src/
│   ├── app/                  # pages/routes (App Router)
│   ├── components/           # UI components
│   ├── lib/                  # helper, auth, prisma, service utils
│   ├── middleware/           # RBAC helper middleware
│   ├── server/               # service/domain layer server-side
│   └── types/                # shared types
├── tests/                    # Playwright tests
├── middleware.ts             # Next.js middleware entry
├── next.config.ts            # Next.js config
├── docker-compose.yml        # PostgreSQL fallback + MinIO + MariaDB legacy profile
├── TODO.md                   # checklist aktif pembangunan
└── package.json              # scripts & dependencies
```

## Dokumentasi Tambahan

- Theming: `docs/THEMING.md`
- Notifications: `docs/NOTIFICATIONS.md`
- Backup & restore: `docs/BACKUP.md`
- Dapodik: `docs/DAPODIK.md`
- Referensi awal: `docs/reference/School_ERP_Architecture_Plan.docx`
- Checklist historis: `docs/archive/TODO_HISTORY.md`
