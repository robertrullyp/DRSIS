P0 - Fondasi
- [x] Auth NextAuth (Credentials, JWT)
- [x] RBAC Role/Permission + middleware guard
- [x] Prisma schema + generate client
- [x] Seeder roles + admin user
- [x] API skeleton + Zod validation
- [x] S3/MinIO storage util + presign endpoint
- [x] Providers (Session, React Query)
- [x] OpenAPI generator + endpoints (master/admin/library/assets/extras/ppdb/assessments/report)
- [x] Base UI components (Button, Input, Select) + pemakaian awal di HR pages
- [x] NextAuth App Route (/api/auth/[...nextauth])
- [x] Dashboard guard (SSR getServerSession + redirect)
- [x] Halaman publik di root (/) + pengecualian middleware untuk rute publik
- [x] Header AppShell: Profil Saya + Logout
- [x] Sistem tema UI (token CSS variables, ThemeProvider, toggle light/dark/system + contoh tema brand)
 - [x] Penerapan tema ke seluruh halaman (token-based) + gaya modern/futuristik (gradien, glass)
 - [x] Branding profil sekolah (logo+nama) di AppShell & beranda publik
 - [x] API publik profil sekolah (`/api/public/school`)
 - [x] Halaman Sign-in & Auth Error dengan branding sekolah
 - [x] Web App Manifest dinamis (nama+ikon dari profil sekolah)
 - [x] Footer publik (alamat, kontak)

P1 - Akademik & HR
- [x] Master/Akademik Data CRUD (academic-years, semesters, grades, classrooms, subjects, curricula, teachers, students, enrollments, schedules)
- [x] Profil Sekolah (CRUD)
 - [x] Rename menu "Master Data" -> "Akademik"
- [x] Users & Roles Admin UI (assign roles, manage permissions)
- [x] Absensi siswa (by class+date)
- [x] Absensi pegawai (shift + checkin/checkout basic)
- [x] Absensi pegawai (approval, timesheet)
- [x] Absensi pegawai (rules lanjutan: toleransi check-in, jam inti, export CSV)
- [x] Penilaian input + agregasi
- [x] Raport PDF (React-PDF) + S3 upload
- [x] Cuti/Izin pegawai (leave types, pengajuan, approval)
- [ ] Portal Siswa/Ortu (jadwal, nilai, raport, presensi, tagihan, tabungan, notifikasi)
  - [x] Jadwalku (kelas aktif)
  - [x] Nilai (rata-rata per mapel)
  - [x] Raport (daftar + link PDF)
  - [x] Presensi (status harian)
  - [x] Tagihan
  - [x] Tabungan
  - [x] Notifikasi (ringkasan portal)
  - [x] Kartu Pelajar (PDF CR-80 via portal)
- [ ] Portal Pegawai (check-in/out, timesheet, cuti/izin)
  - [x] Check-in/Out (WEB)
  - [x] Timesheet Saya (rentang tanggal)
  - [x] Geolocation capture (check-in/out; tampil di timesheet)
  - [x] Cuti/Izin (tipe, pengajuan, approval)
  - [x] Dinas/Pelatihan via tipe cuti (counts-as-presence)

P2 - Admin/Operasional
- [x] PPDB (form publik + upload, verifikasi, skor, auto-enroll)
- [x] PPDB (pengumuman publik: status & announcement)
- [x] Perpustakaan (katalog, anggota, pinjam/kembali, denda, barcode, settings)
- [x] Aset (register, lokasi, pinjam, perawatan)
- [x] Aset (depresiasi & laporan)
- [x] Ekstrakurikuler (anggota, presensi, event)
- [x] BK/Konseling (tiket, sesi, rujukan)
- [ ] Portal Publik (CMS: Berita, Agenda, Galeri, Profil, Kontak)
- [ ] CMS konten (post, event) + halaman publik

P3 - Finansial
- [x] Keuangan (biaya, tagihan massal, pembayaran, kuitansi)
- [x] Tabungan siswa (akun, setoran/penarikan, approval, buku)
- [ ] Keuangan (diskon, beasiswa, refund, laporan)

P4 - Integrasi & Notifikasi
- [ ] LMS/CBT link, impor skor
- [ ] Notifikasi WA/Email (templates, outbox, webhook, retry)
  - [x] WA Outbox enqueue untuk workflow Cuti/Izin (ajukan/approve/reject)
  - [x] Sender route (manual) + retry/cancel actions
  - [x] Admin UI (WA Outbox + WA Templates)
  - [x] Email SMTP outbox (provider, templates, outbox, UI)
  - [x] Cron facade endpoint (/api/admin/cron/tick)
  - [ ] Panggil cron secara terjadwal (Actions/cron/systemd)
- [ ] Analitik & dashboard (events + KPI presensi/nilai/ppdb/perpustakaan/aset)
- [ ] CBT internal (bank soal, ujian, attempts, skor)

P5 - Hardening
- [ ] Logging & metrics (prod-grade; audit events across modules)
- [ ] Backup strategi
- [x] E2E smoke tests (Playwright: public, sign-in, blokir dashboard, login)
- [ ] CI/CD integrasi untuk e2e
- [x] Turbopack root + outputFileTracingRoot diselaraskan (hilangkan warning dev)
- [ ] Tambah cakupan e2e (PPDB publik, Library, Aset, HR)
- [ ] Uptime monitoring/ping + health checks (observability)
- [ ] CI/CD pipeline build/test/deploy (GitHub Actions)


