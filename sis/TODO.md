P0 – Fondasi
- [x] Auth NextAuth (Credentials, JWT)
- [x] RBAC Role/Permission + middleware guard
- [x] Prisma schema + generate client
- [x] Seeder roles + admin user
- [x] API skeleton + Zod validation
- [x] S3/MinIO storage util + presign endpoint
- [x] Providers (Session, React Query)
- [ ] shadcn/ui init + base components

P1 – Akademik & HR
- [ ] Master Data CRUD (tahun ajaran, semester, kelas, mapel, kurikulum, guru, siswa, users & roles)
- [ ] Absensi siswa (by class+date)
- [ ] Absensi pegawai (shift, QR/PIN/GPS, approval)
- [ ] Penilaian input + agregasi
- [ ] Raport PDF (React-PDF / Puppeteer)

P2 – Admin
- [ ] PPDB (form, upload, verifikasi, skor, pengumuman, auto-enroll)
- [ ] Perpustakaan (katalog, anggota, pinjam/kembali, denda)
- [ ] Aset (register, lokasi, pinjam, perawatan, depresiasi)
- [ ] Ekstrakurikuler (anggota, presensi, event)
- [ ] BK/Konseling (tiket, sesi, rujukan)

P3 – Finansial
- [ ] Keuangan (biaya, tagihan massal, pembayaran, kuitansi)
- [ ] Tabungan siswa (akun, setoran/penarikan, approval, buku)

P4 – Integrasi
- [ ] LMS/CBT link, impor skor
- [ ] Notifikasi WA/Email (outbox, worker, retry)
- [ ] Analitik & dashboard (events → KPI)

P5 – Hardening
- [ ] Logging & metrics
- [ ] Backup strategi
- [ ] CI/CD + e2e

