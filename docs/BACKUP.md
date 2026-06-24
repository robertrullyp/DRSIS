# Backup & Restore

Dokumen ini menjelaskan strategi backup untuk DRSIS. Database utama adalah PostgreSQL. MariaDB hanya dipertahankan sebagai legacy compatibility jika perlu membaca instalasi lama.

## 1) Komponen Yang Perlu Dibackup

- Database PostgreSQL utama.
- Object storage S3/MinIO:
  - PDF raport, kuitansi, upload PPDB, CMS media, dan object lain yang dipakai aplikasi.
- Secrets & konfigurasi:
  - `.env` di server: `DATABASE_URL`, `NEXTAUTH_SECRET`, kredensial S3/MinIO, `CRON_SECRET`, SMTP/WA credential jika ada.
  - Secrets CI/CD: `CRON_SECRET`, `CRON_TICK_URL`, `UPTIME_BASE_URL`, dan secret provider eksternal.

## 2) Backup Database PostgreSQL

Rekomendasi awal: `pg_dump` custom format agar restore lebih fleksibel.

```bash
export PGPASSWORD='sis'
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --host=127.0.0.1 \
  --port=5432 \
  --username=sis \
  --dbname=sis \
  --file=backup_drsis_$(date +%F_%H%M).dump
unset PGPASSWORD
```

Untuk SQL biasa:

```bash
export PGPASSWORD='sis'
pg_dump \
  --host=127.0.0.1 \
  --port=5432 \
  --username=sis \
  --dbname=sis \
  > backup_drsis_$(date +%F_%H%M).sql
unset PGPASSWORD
```

## 3) Restore PostgreSQL

Restore custom dump ke database kosong:

```bash
export PGPASSWORD='sis'
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --host=127.0.0.1 \
  --port=5432 \
  --username=sis \
  --dbname=sis \
  backup_drsis_YYYY-MM-DD_HHMM.dump
unset PGPASSWORD
```

Restore SQL biasa:

```bash
export PGPASSWORD='sis'
psql \
  --host=127.0.0.1 \
  --port=5432 \
  --username=sis \
  --dbname=sis \
  < backup_drsis_YYYY-MM-DD_HHMM.sql
unset PGPASSWORD
```

## 4) Backup Object Storage

### MinIO

```bash
mc alias set local http://127.0.0.1:9000 minioadmin minioadmin
mc mirror --overwrite local/sis-uploads ./backup/minio/sis-uploads
```

### S3

```bash
aws s3 sync s3://YOUR_BUCKET ./backup/s3/YOUR_BUCKET
```

## 5) Secrets/Config

- Backup `.env` produksi ke tempat terenkripsi.
- Jangan commit `.env`.
- Catat daftar secrets CI/CD setiap release.
- Rotasi credential S3/SMTP/WA/PostgreSQL sesuai kebijakan sekolah.

## 6) Frekuensi & Retensi

- PostgreSQL: harian dengan retensi 14-30 hari, mingguan dengan retensi 3-6 bulan.
- Object storage: harian/mingguan sesuai volume upload.
- Uji restore minimal 1x/bulan di staging.
- Simpan minimal satu backup offsite.

## 7) Legacy MariaDB

Jika ada instalasi lama berbasis MariaDB, backup tetap dapat dilakukan dengan `mysqldump` sebelum migrasi manual. Runtime utama DRSIS setelah perombakan ini tidak memakai MariaDB.
