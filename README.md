# DRSIS — Next.js + Prisma SIS

Sistem Informasi Sekolah — foundation scaffold per blueprint (Next.js App Router, Prisma/MariaDB/MySQL, NextAuth JWT RBAC, Tailwind, React Query, S3/MinIO, OpenAPI).

Quick start
- Prereqs: Node 18+, Docker Desktop
- Copy env: `cp sis/.env.example sis/.env` and set `NEXTAUTH_SECRET`
- Start DB + MinIO: `docker compose up -d`
- Install deps: `cd sis && npm i`
- Generate Prisma: `npm run db:generate`
- Create schema: `npm run db:push`
- Seed roles/admin: `npm run db:seed`
- Dev server: `npm run dev` then open http://localhost:3000

Default admin (change after first login)
- Email: `admin@sis.local`
- Password: `admin123`

What’s inside (P0 foundation)
- Auth: NextAuth (Credentials, JWT) with RBAC payload
- RBAC: Role/Permission models + middleware guard
- DB: MariaDB/MySQL via Prisma (rich schema)
- UI: Tailwind (App Router), basic sign-in, providers (Session + React Query)
- API: Health, Master/Grades (list/create) with Zod validation
- Storage: MinIO/S3 client + presign API
- OpenAPI: generator script from Zod registry example

Docker services
- Postgres: `localhost:5432` (db=sis, user=postgres, pass=postgres)
- MinIO: API `:9000`, Console `:9001` (user/pass: minioadmin)

Useful scripts (in `sis/package.json`)
- `db:generate` — Prisma client
- `db:push` — Create DB schema (dev)
- `db:push` — Migrations (when adding changes)
- `db:seed` — Seed roles + admin
- `openapi:gen` — Generate `openapi/openapi.json`

TODO (milestones)
- P1: Master Data CRUD pages, Attendance (student/staff), Assessment & Report PDF
- P2: PPDB, Library flows, Assets, Extracurricular, Counseling
- P3: Finance (invoicing, payments), Savings (transactions, approvals)
- P4: Integrations (LMS/CBT), WA/Email workers + webhook, Analytics dashboards
- P5: Observability (structured logs, metrics), backups, CI/CD, e2e tests

Code pointers
- Prisma schema: `sis/prisma/schema.prisma`
- Seed data: `sis/prisma/seed.ts`
- Auth config: `sis/src/lib/auth.ts` and `sis/middleware.ts`
- Prisma client: `sis/src/lib/prisma.ts`
- API examples: `sis/src/app/api/health/route.ts`, `sis/src/app/api/master/grades/route.ts`
- S3 util: `sis/src/lib/s3.ts`
- Providers: `sis/src/app/providers.tsx`
- Sign-in page: `sis/src/app/(auth)/sign-in/page.tsx`

Notes
- Financial and savings operations must use `prisma.$transaction()` (enforce in service layer when implementing).
- Add shadcn/ui components and design system when starting the front-end screens.
- Expand RBAC rules in `sis/src/middleware/rbac.ts` per module routes.


