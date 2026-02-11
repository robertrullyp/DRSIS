# DRSIS — School Information System

DRSIS adalah Sistem Informasi Sekolah berbasis Next.js App Router, Prisma, NextAuth JWT RBAC, Tailwind v4, React Query, dan integrasi S3/MinIO.

## Tech Stack

- Next.js 15 (App Router + Turbopack)
- TypeScript
- Prisma + MariaDB
- NextAuth (Credentials, JWT)
- Tailwind CSS v4
- React Query
- Playwright (E2E smoke tests)

## Quick Start

### Prasyarat

- Node.js 18+
- MariaDB lokal aktif di `localhost:3306`
- Docker (opsional, untuk MinIO)

### Setup lokal

```bash
cp .env.example .env
npm install
# opsional: jalankan MinIO via Docker
npm run db:up
npm run db:generate
npm run db:push
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

## Service Lokal

- MariaDB lokal: `localhost:3306` (mengikuti `DATABASE_URL` di `.env`)
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
- `npm run db:down` - matikan MinIO Docker
- `npm run db:e2e:up` - info mode E2E (pakai DB lokal dari env)
- `npm run db:e2e:down` - info mode E2E
- `npm run db:generate` - generate Prisma Client
- `npm run db:push` - sinkronkan schema ke database
- `npm run db:seed` - seed role, permission, dan admin
- `npm run openapi:gen` - generate `openapi/openapi.json`
- `npm run test:e2e` - jalankan Playwright tests

Catatan E2E:
- Playwright default memakai `E2E_DATABASE_URL`, fallback ke `DATABASE_URL` (default port `3306`).
- Pastikan DB target untuk E2E boleh ditulis (karena `prisma db push` + seed berjalan saat setup test).

## Struktur Project

```text
.
├── docs/                     # dokumentasi modul/theming/notifikasi
├── prisma/                   # schema + seed
├── public/                   # static assets
├── src/
│   ├── app/                  # pages/routes (App Router)
│   ├── components/           # UI components
│   ├── lib/                  # helper, auth, prisma, service utils
│   ├── middleware/           # RBAC helper middleware
│   ├── server/               # server-side utilities (contoh: OpenAPI generator)
│   └── types/                # shared types
├── tests/                    # Playwright tests
├── middleware.ts             # Next.js middleware entry
├── next.config.ts            # Next.js config
├── docker-compose.yml        # MariaDB + MinIO
├── TODO.md                   # milestone pengembangan
└── package.json              # scripts & dependencies
```

## Dokumentasi Tambahan

- Theming: `docs/THEMING.md`
- Notifications: `docs/NOTIFICATIONS.md`
- Roadmap: `TODO.md`
