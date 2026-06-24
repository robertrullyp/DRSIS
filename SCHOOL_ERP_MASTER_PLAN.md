# DRSIS School ERP Master Plan

## 1. Ringkasan Produk

DRSIS adalah platform ERP sekolah berbasis web untuk operasional akademik, administrasi, portal siswa/orang tua, portal pegawai, PPDB, CMS website sekolah, keuangan, perpustakaan, aset, komunikasi, analitik, dan integrasi eksternal.

Target utama saat ini adalah memperkuat sistem web terlebih dahulu. Mobile app disiapkan sebagai fase berikutnya melalui kontrak API, auth boundary, dan data scope yang rapi.

## 2. Target Arsitektur

- Frontend dan backend utama tetap memakai Next.js App Router sebagai modular monolith.
- React digunakan untuk UI interaktif dashboard, portal, dan CMS admin.
- Prisma menjadi data access layer tunggal.
- PostgreSQL adalah database utama.
- MariaDB hanya legacy compatibility untuk referensi instalasi lama.
- S3/MinIO tetap menjadi object storage untuk media, dokumen PPDB, PDF raport, kuitansi, dan asset publik.
- REST API App Router tetap menjadi interface utama.
- OpenAPI generator menjadi kontrak dokumentasi API.
- Mobile app masa depan memakai API yang sama, bukan membaca database langsung.

## 3. Current State Snapshot

Repo saat ini sudah berisi fondasi besar:

- Auth NextAuth Credentials + JWT.
- RBAC role/permission dan middleware guard.
- Master akademik, siswa, guru, kelas, enrollment, jadwal.
- Absensi siswa dan pegawai.
- HR, cuti/izin, portal pegawai.
- Portal siswa/orang tua.
- PPDB publik dan admin.
- CMS website sekolah: berita, agenda, galeri, halaman, menu, kontak, SEO.
- Finance siswa, tabungan, finance operasional, laporan.
- Perpustakaan, aset, ekstrakurikuler, BK/konseling.
- LMS/CBT link dan import skor.
- Dapodik sync foundation.
- WA/email outbox, template, webhook, retry.
- Analytics foundation, audit log, metrics, health check, backup docs, Playwright smoke tests.

Update implementasi saat ini:

- PostgreSQL foundation sudah menjadi runtime default melalui Prisma provider `postgresql`, baseline migration PostgreSQL, Docker dev/E2E, dan dokumentasi backup PostgreSQL.
- Persistent notification inbox sudah tersedia untuk portal, dengan admin API/UI, status read/archive, dan fallback notifikasi generated dari billing/presensi/raport.
- Analytics sudah memiliki event log dan snapshot summary harian sebagai boundary event-driven analytics.
- CBT internal v1 sudah tersedia melalui API admin untuk ujian/soal dan portal siswa untuk list/start/submit attempt dengan auto-grading sederhana.
- Dapodik memiliki status endpoint dan adapter boundary `disabled|mock|real`; real connector tetap menunggu credential/scope resmi.
- Readiness check memvalidasi DB connectivity dan konfigurasi runtime utama, termasuk `DATABASE_URL` PostgreSQL.

## 4. Prinsip Desain Sistem

- Secure by default: route sensitif harus deny-by-default.
- Permission-first: role hanya shortcut dari permission, bukan satu-satunya sumber kebijakan.
- API route harus tipis; business logic masuk service/domain layer.
- Semua input API tervalidasi Zod.
- Semua endpoint penting masuk OpenAPI.
- Semua aksi mutasi domain penting menulis audit event.
- Data portal harus scoped ke user aktif.
- Public CMS hanya mengekspos konten `PUBLISHED` dan `publishedAt <= now`.
- Background process harus idempotent dan bisa retry.
- UI harus responsive, konsisten, dan mobile friendly.

## 5. Domain Map

| Domain | Modul |
| --- | --- |
| Identity | Auth, RBAC, user, role, permission, session |
| Academic | Tahun ajaran, semester, kelas, rombel, mapel, kurikulum, guru, siswa, jadwal, nilai, raport |
| HR | Pegawai, shift, absensi, timesheet, cuti, izin, dinas/pelatihan |
| Portals | Portal siswa, portal orang tua, portal pegawai |
| Admission | PPDB, verifikasi, scoring, pengumuman, auto enrollment |
| Finance | Billing, payment, receipt, discount, scholarship, refund, savings, operational finance |
| Content | CMS website, media, menu, SEO, kontak |
| Services | Library, assets, extracurricular, counseling |
| Communication | WA, email, templates, outbox, webhook, notification center |
| Integration | LMS/CBT link, CBT internal v1, Dapodik adapter boundary, future mobile API |
| Governance | Audit, metrics, health, backup, release gate |

## 6. PostgreSQL Direction

PostgreSQL menjadi database utama karena lebih cocok untuk ERP modern, data integrity, reporting, JSON/analytics, transactional finance, dan ekspansi service ke depan.

Standar koneksi lokal:

```bash
DATABASE_URL=postgresql://sis:sis@127.0.0.1:5432/sis?schema=public
```

Docker PostgreSQL disediakan sebagai fallback pada port `5433`.

## 7. Referensi

- `docs/reference/School_ERP_Architecture_Plan.docx`
- `TODO.md`
- `prisma/schema.prisma`
- `src/app/api/*`
- `docs/DAPODIK.md`
- `docs/BACKUP.md`
