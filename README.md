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
- Docker (untuk MariaDB + MinIO)

### Setup lokal

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

### Default admin

- Email: `admin@sis.local`
- Password: `admin123`

## Docker Services

- MariaDB: `localhost:3306`
  - database: `sis`
  - user: `sis`
  - password: `sis`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`
  - user: `minioadmin`
  - password: `minioadmin`

## Scripts Penting

- `npm run dev` - jalankan development server
- `npm run build` - build production
- `npm run start` - jalankan hasil build
- `npm run lint` - jalankan ESLint
- `npm run db:up` - nyalakan MariaDB via Docker
- `npm run db:down` - matikan service Docker
- `npm run db:generate` - generate Prisma Client
- `npm run db:push` - sinkronkan schema ke database
- `npm run db:seed` - seed role, permission, dan admin
- `npm run openapi:gen` - generate `openapi/openapi.json`
- `npm run test:e2e` - jalankan Playwright tests

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
