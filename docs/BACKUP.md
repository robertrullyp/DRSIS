# Backup & Restore

Dokumen ini menjelaskan strategi backup untuk DRSIS (MariaDB + storage S3/MinIO + secrets).

## 1) Komponen Yang Perlu Dibackup

- Database MariaDB (semua tabel aplikasi).
- Object storage (bucket S3/MinIO):
  - PDF raport, kuitansi, upload PPDB, CMS media, dll (semua object key yang dipakai aplikasi).
- Secrets & konfigurasi:
  - `.env` di server (minimal: `DATABASE_URL`, `NEXTAUTH_SECRET`, kredensial S3/MinIO, `CRON_SECRET`).
  - Secrets CI/CD (GitHub Actions): `CRON_SECRET`, `CRON_TICK_URL`, `UPTIME_BASE_URL`, dll.

## 2) Backup Database (MariaDB)

### Opsi A: mysqldump (umum)

Rekomendasi: gunakan user dengan hak akses read + lock (atau full, tergantung kebijakan).

Contoh (ganti HOST/USER/DBNAME):

```bash
export MYSQL_PWD='PASSWORD_KAMU'
mysqldump \
  --single-transaction \
  --quick \
  --routines --triggers --events \
  -h 127.0.0.1 -u root sis \
  > backup_sis_$(date +%F_%H%M).sql
unset MYSQL_PWD
```

### Restore

```bash
export MYSQL_PWD='PASSWORD_KAMU'
mysql -h 127.0.0.1 -u root sis < backup_sis_YYYY-MM-DD_HHMM.sql
unset MYSQL_PWD
```

Catatan:
- Untuk backup besar, pertimbangkan kompresi: `gzip backup.sql`.
- Pastikan timezone/charset sesuai (default MariaDB biasanya OK).

## 3) Backup Object Storage (S3/MinIO)

### MinIO (mc)

```bash
# install mc: https://min.io/docs/minio/linux/reference/minio-mc.html
mc alias set local http://127.0.0.1:9000 minioadmin minioadmin

# contoh bucket: sis-bucket (sesuaikan dengan S3_BUCKET)
mc mirror --overwrite local/sis-bucket ./backup/minio/sis-bucket
```

### S3 (awscli)

```bash
# install & configure awscli terlebih dulu
aws s3 sync s3://YOUR_BUCKET ./backup/s3/YOUR_BUCKET
```

## 4) Backup Secrets/Config

- Backup `.env` di host produksi (simpan aman, terenkripsi).
- Jangan commit `.env` ke repo.
- Jika pakai GitHub Actions:
  - catat list secrets yang dipakai workflow:
    - `CRON_TICK_URL`, `CRON_SECRET` (cron tick)
    - `UPTIME_BASE_URL` (uptime check)

## 5) Frekuensi & Retensi (rekomendasi awal)

- DB: harian (retensi 14-30 hari) + mingguan (retensi 3-6 bulan).
- Storage: harian/mingguan tergantung volume (atau gunakan versioning/lifecycle di S3).
- Uji restore minimal 1x/bulan di staging.

