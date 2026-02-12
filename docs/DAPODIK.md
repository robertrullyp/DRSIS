# Integrasi Dapodik (Rencana + Skeleton)

Dokumen ini menjelaskan arah integrasi Dapodik secara aman (compliance-first) dan apa yang sudah disiapkan di codebase saat ini.

## Prinsip

- Gunakan jalur integrasi resmi yang diizinkan oleh Kemendikbudristek.
- Hindari scraping / reverse engineering endpoint Dapodik yang tidak didokumentasikan secara resmi.
- Perlakukan data sensitif (NIK/NISN, identitas peserta didik/PTK) sebagai data berisiko tinggi: minimisasi akses, audit trail, retensi, masking log.

## Catatan Autentikasi (SSO)

- **SSO Dapodik lama dinyatakan deprecated** dan diarahkan untuk menggunakan **SSO SDS**.
  - Ref: https://sp.datadik.kemdikbud.go.id/sso
- **SSO SDS (OIDC/OAuth2)** tersedia dan didokumentasikan untuk integrasi aplikasi pihak ketiga (perlu registrasi aplikasi dan persetujuan).
  - Contoh dokumentasi SSO SDS (staging): https://auth.siplah.kemdikbud.go.id/docs/

Catatan: implementasi “real connector” tetap bergantung pada akses resmi (client id/secret + scope + endpoint data) yang biasanya tidak bersifat publik.

## Apa Yang Sudah Ada Di Repo (skeleton)

### 1) Queue “Dapodik Sync Batch”

- Prisma model:
  - `DapodikSyncBatch` + enum `DapodikSyncBatchStatus` di `prisma/schema.prisma`
  - `DapodikStagingRow` + enum `DapodikStagingStatus` untuk tabel staging rekonsiliasi
- Runner:
  - `src/server/integrations/dapodik/dapodik.queue.ts`
  - Memproses batch berstatus `PENDING` dengan retry + exponential backoff.
  - Mode saat ini:
    - `DAPODIK_SYNC_MODE=mock`: tidak ada external call (hanya set metaJson)
    - `DAPODIK_SYNC_MODE=real`: belum diimplementasikan (akan gagal dengan error terarah)

### 2) Cron Tick Terintegrasi

`/api/admin/cron/tick` sekarang memproses:
- WA outbox
- Email outbox
- **Dapodik sync queue** (jika enabled)

File: `src/app/api/admin/cron/tick/route.ts`

### 3) Admin API

- List + enqueue:
  - `GET /api/admin/dapodik/batches`
  - `POST /api/admin/dapodik/batches`
- Retry:
  - `POST /api/admin/dapodik/batches/:id/retry`
- Manual process (sekali jalan):
  - `POST /api/admin/dapodik/process`

### 4) Admin UI

- Halaman: `/admin/dapodik`
- File: `src/app/(dashboard)/admin/dapodik/page.tsx`
- Staging UI: `/admin/dapodik/staging`
- File: `src/app/(dashboard)/admin/dapodik/staging/page.tsx`

## Environment Variables

Tambahkan/atur di `.env`:

```bash
DAPODIK_SYNC_ENABLED=true
DAPODIK_SYNC_MODE=mock   # disabled|mock|real
DAPODIK_SYNC_MAX_ATTEMPTS=5
```

## Next Implementasi (Real Connector)

Tahap berikutnya (sesuai TODO P4):

1. Discovery & kepatuhan integrasi resmi (scope API, SSO SDS, prasyarat registrasi).
2. Desain mapping domain + staging + rekonsiliasi (`NEW/MATCHED/CONFLICT/REJECTED`).
3. Implementasi connector `real`:
   - auth adapter
   - client
   - mapper
   - orchestrator batch (idempotent)
4. Observability + dashboard monitoring sync.
