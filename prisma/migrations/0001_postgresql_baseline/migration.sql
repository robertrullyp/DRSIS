-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DapodikSyncBatchStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "DapodikStagingStatus" AS ENUM ('NEW', 'MATCHED', 'CONFLICT', 'REJECTED');

-- CreateEnum
CREATE TYPE "CmsStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CmsPostType" AS ENUM ('NEWS', 'ARTICLE', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "CmsMenuItemType" AS ENUM ('INTERNAL', 'EXTERNAL', 'PAGE', 'CATEGORY', 'TAG');

-- CreateEnum
CREATE TYPE "CmsMenuVisibility" AS ENUM ('PUBLIC', 'AUTH_ONLY', 'ROLE_ONLY');

-- CreateEnum
CREATE TYPE "CmsPageTemplate" AS ENUM ('DEFAULT', 'PROFILE', 'CONTACT', 'LANDING');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('aktif', 'nonaktif', 'ditangguhkan');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('laki_laki', 'perempuan', 'lainnya');

-- CreateEnum
CREATE TYPE "StudentAttendanceStatus" AS ENUM ('hadir', 'izin', 'sakit', 'alfa', 'terlambat');

-- CreateEnum
CREATE TYPE "StaffAttendanceStatus" AS ENUM ('hadir', 'izin', 'sakit', 'alfa', 'terlambat');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('menunggu', 'terverifikasi', 'ditolak', 'diterima', 'terdaftar');

-- CreateEnum
CREATE TYPE "GuardianRelationType" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draf', 'terbuka', 'parsial', 'lunas', 'batal');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('tunai', 'transfer', 'gateway', 'beasiswa', 'penyesuaian');

-- CreateEnum
CREATE TYPE "SavingsTxnType" AS ENUM ('setoran', 'penarikan', 'penyesuaian');

-- CreateEnum
CREATE TYPE "FinanceAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "CashBankType" AS ENUM ('CASH', 'BANK');

-- CreateEnum
CREATE TYPE "OperationalTxnKind" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "WaStatus" AS ENUM ('menunggu', 'terkirim', 'tersampaikan', 'gagal', 'dibatalkan');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('menunggu', 'disetujui', 'ditolak', 'dibatalkan');

-- CreateEnum
CREATE TYPE "FinanceBudgetKind" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "profil_sekolah" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "npsn" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "principal" TEXT,
    "accreditation" TEXT,
    "motto" TEXT,
    "vision" TEXT,
    "mission" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profil_sekolah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengguna" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'aktif',
    "passwordHash" TEXT,
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peran" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "peran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hak_akses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "hak_akses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peran_hak_akses" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "peran_hak_akses_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "guru" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nidn" TEXT,
    "hireDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siswa" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nis" TEXT,
    "nisn" TEXT,
    "photoUrl" TEXT,
    "gender" "Gender",
    "birthDate" TIMESTAMP(3),
    "startYear" INTEGER,
    "guardianName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relasi_wali_siswa" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "guardianUserId" TEXT NOT NULL,
    "relation" "GuardianRelationType" NOT NULL DEFAULT 'GUARDIAN',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relasi_wali_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pegawai" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nik" TEXT,
    "position" TEXT,
    "joinDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahun_ajaran" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tahun_ajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER,
    "academicYearId" TEXT NOT NULL,

    CONSTRAINT "semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tingkat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tingkat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelas" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "homeroomTeacherId" TEXT,
    "academicYearId" TEXT NOT NULL,

    CONSTRAINT "kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mata_pelajaran" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeId" TEXT,
    "curriculumId" TEXT,

    CONSTRAINT "mata_pelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kurikulum" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER,
    "notes" TEXT,

    CONSTRAINT "kurikulum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendaftaran_kelas" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pendaftaran_kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "jadwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absensi_siswa" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "StudentAttendanceStatus" NOT NULL,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absensi_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_pegawai" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "shift_pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absensi_pegawai" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "StaffAttendanceStatus" NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "method" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absensi_pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penilaian" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "score" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penilaian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raport" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "remarks" TEXT,
    "pdfUrl" TEXT,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppdb_pendaftaran" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "gradeAppliedId" TEXT,
    "documents" TEXT,
    "score" DOUBLE PRECISION,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'menunggu',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "decisionAt" TIMESTAMP(3),
    "enrolledStudentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppdb_pendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aturan_biaya" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeId" TEXT,
    "amount" INTEGER NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "aturan_biaya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tagihan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'terbuka',
    "total" INTEGER NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tagihan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_tagihan" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "item_tagihan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembayaran" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "createdById" TEXT,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diskon" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,

    CONSTRAINT "diskon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upaya_pembayaran" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upaya_pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengembalian_dana" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "processedBy" TEXT,

    CONSTRAINT "pengembalian_dana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buku_kas" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "memo" TEXT,
    "createdBy" TEXT,

    CONSTRAINT "buku_kas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keu_akun" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinanceAccountType" NOT NULL,
    "category" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keu_akun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keu_rekening_kas_bank" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CashBankType" NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ownerName" TEXT,
    "openingBalance" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keu_rekening_kas_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keu_transaksi_operasional" (
    "id" TEXT NOT NULL,
    "txnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "OperationalTxnKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "referenceNo" TEXT,
    "proofUrl" TEXT,
    "accountId" TEXT NOT NULL,
    "cashBankAccountId" TEXT NOT NULL,
    "transferPairId" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'menunggu',
    "createdBy" TEXT,
    "checkedBy" TEXT,
    "checkedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keu_transaksi_operasional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keu_lock_periode" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "lockedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keu_lock_periode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keu_anggaran" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "kind" "FinanceBudgetKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "notes" TEXT,
    "accountId" TEXT NOT NULL,
    "cashBankAccountId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keu_anggaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beasiswa" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "beasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tabungan_akun" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tabungan_akun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tabungan_transaksi" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "SavingsTxnType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tabungan_transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perpus_koleksi" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "year" INTEGER,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "available" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "perpus_koleksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perpus_anggota" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "studentId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perpus_anggota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perpus_barcode" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,

    CONSTRAINT "perpus_barcode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perpus_pengaturan" (
    "id" TEXT NOT NULL,
    "maxLoans" INTEGER NOT NULL DEFAULT 3,
    "loanDays" INTEGER NOT NULL DEFAULT 7,
    "finePerDay" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "perpus_pengaturan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perpus_pinjaman" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "fine" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "perpus_pinjaman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aset_kategori" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "aset_kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aset" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "location" TEXT,
    "acquisitionDate" TIMESTAMP(3),
    "value" INTEGER,
    "depreciationRate" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "aset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aset_peminjaman" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "borrowerUserId" TEXT NOT NULL,
    "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),

    CONSTRAINT "aset_peminjaman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aset_perawatan" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "aset_perawatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ekstrakurikuler" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coachTeacherId" TEXT,

    CONSTRAINT "ekstrakurikuler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ekstra_anggota" (
    "id" TEXT NOT NULL,
    "extracurricularId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ekstra_anggota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ekstra_absensi" (
    "id" TEXT NOT NULL,
    "extracurricularId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "StudentAttendanceStatus" NOT NULL,

    CONSTRAINT "ekstra_absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ekstra_event" (
    "id" TEXT NOT NULL,
    "extracurricularId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "result" TEXT,

    CONSTRAINT "ekstra_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bk_tiket" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bk_tiket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bk_sesi" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "counselorUserId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "bk_sesi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bk_rujukan" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "referredTo" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bk_rujukan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_link" (
    "id" TEXT NOT NULL,
    "external" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "classroomId" TEXT,
    "subjectId" TEXT,

    CONSTRAINT "lms_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ujian" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subjectId" TEXT,
    "classroomId" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),

    CONSTRAINT "ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ujian_pengerjaan" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "ujian_pengerjaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ujian_soal" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" TEXT,
    "answer" TEXT,

    CONSTRAINT "ujian_soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_skor" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_skor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dapodik_sync_batch" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" "DapodikSyncBatchStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3),
    "requestedBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dapodik_sync_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dapodik_staging" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" "DapodikStagingStatus" NOT NULL DEFAULT 'NEW',
    "dataJson" TEXT NOT NULL,
    "matchedLocalType" TEXT,
    "matchedLocalId" TEXT,
    "conflictJson" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dapodik_staging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_aktivitas" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "userId" TEXT,
    "data" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_aktivitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_event" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "meta" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_template" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT,

    CONSTRAINT "wa_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_outbox" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "to" TEXT NOT NULL,
    "payload" TEXT,
    "status" "WaStatus" NOT NULL DEFAULT 'menunggu',
    "providerMsgId" TEXT,
    "sentAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),

    CONSTRAINT "wa_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuti_tipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxDaysPerYear" INTEGER,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "countsAsPresence" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cuti_tipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuti_pengajuan" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'menunggu',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuti_pengajuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_template" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT,

    CONSTRAINT "email_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT,
    "payload" TEXT,
    "status" "WaStatus" NOT NULL DEFAULT 'menunggu',
    "providerMsgId" TEXT,
    "sentAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_menu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "template" "CmsPageTemplate" NOT NULL DEFAULT 'DEFAULT',
    "blocks" JSONB,
    "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "publishedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_menu_item" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "type" "CmsMenuItemType" NOT NULL DEFAULT 'INTERNAL',
    "visibility" "CmsMenuVisibility" NOT NULL DEFAULT 'PUBLIC',
    "roleNames" TEXT,
    "href" TEXT,
    "pageId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_menu_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_post" (
    "id" TEXT NOT NULL,
    "type" "CmsPostType" NOT NULL DEFAULT 'NEWS',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverMediaId" TEXT,
    "authorId" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "publishedBy" TEXT,
    "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_media" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "filename" TEXT NOT NULL DEFAULT '',
    "url" TEXT,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "blurhash" TEXT,
    "thumbUrl" TEXT,
    "alt" TEXT,
    "title" TEXT,
    "module" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_post_category" (
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "cms_post_category_pkey" PRIMARY KEY ("postId","categoryId")
);

-- CreateTable
CREATE TABLE "cms_post_tag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "cms_post_tag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "cms_event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),
    "coverMediaId" TEXT,
    "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "publishedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_gallery" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverMediaId" TEXT,
    "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "publishedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_gallery_item" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "caption" TEXT,
    "itemOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_gallery_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_contact_message" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_contact_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profil_sekolah_npsn_key" ON "profil_sekolah"("npsn");

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_email_key" ON "pengguna"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_phone_key" ON "pengguna"("phone");

-- CreateIndex
CREATE INDEX "pengguna_roleId_idx" ON "pengguna"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "peran_name_key" ON "peran"("name");

-- CreateIndex
CREATE UNIQUE INDEX "hak_akses_name_key" ON "hak_akses"("name");

-- CreateIndex
CREATE INDEX "peran_hak_akses_permissionId_idx" ON "peran_hak_akses"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "guru_userId_key" ON "guru"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "guru_nidn_key" ON "guru"("nidn");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_userId_key" ON "siswa"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_nis_key" ON "siswa"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_nisn_key" ON "siswa"("nisn");

-- CreateIndex
CREATE INDEX "relasi_wali_siswa_guardianUserId_idx" ON "relasi_wali_siswa"("guardianUserId");

-- CreateIndex
CREATE UNIQUE INDEX "relasi_wali_siswa_studentId_guardianUserId_key" ON "relasi_wali_siswa"("studentId", "guardianUserId");

-- CreateIndex
CREATE UNIQUE INDEX "pegawai_userId_key" ON "pegawai"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pegawai_nik_key" ON "pegawai"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "tahun_ajaran_name_key" ON "tahun_ajaran"("name");

-- CreateIndex
CREATE INDEX "semester_academicYearId_idx" ON "semester"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "tingkat_name_key" ON "tingkat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "kelas_code_key" ON "kelas"("code");

-- CreateIndex
CREATE INDEX "kelas_academicYearId_idx" ON "kelas"("academicYearId");

-- CreateIndex
CREATE INDEX "kelas_gradeId_idx" ON "kelas"("gradeId");

-- CreateIndex
CREATE INDEX "kelas_homeroomTeacherId_idx" ON "kelas"("homeroomTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "mata_pelajaran_code_key" ON "mata_pelajaran"("code");

-- CreateIndex
CREATE INDEX "mata_pelajaran_curriculumId_idx" ON "mata_pelajaran"("curriculumId");

-- CreateIndex
CREATE INDEX "mata_pelajaran_gradeId_idx" ON "mata_pelajaran"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "kurikulum_name_key" ON "kurikulum"("name");

-- CreateIndex
CREATE INDEX "pendaftaran_kelas_academicYearId_idx" ON "pendaftaran_kelas"("academicYearId");

-- CreateIndex
CREATE INDEX "pendaftaran_kelas_classroomId_idx" ON "pendaftaran_kelas"("classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "pendaftaran_kelas_studentId_academicYearId_key" ON "pendaftaran_kelas"("studentId", "academicYearId");

-- CreateIndex
CREATE INDEX "jadwal_classroomId_idx" ON "jadwal"("classroomId");

-- CreateIndex
CREATE INDEX "jadwal_subjectId_idx" ON "jadwal"("subjectId");

-- CreateIndex
CREATE INDEX "jadwal_teacherId_idx" ON "jadwal"("teacherId");

-- CreateIndex
CREATE INDEX "absensi_siswa_classroomId_idx" ON "absensi_siswa"("classroomId");

-- CreateIndex
CREATE INDEX "absensi_siswa_recordedById_idx" ON "absensi_siswa"("recordedById");

-- CreateIndex
CREATE INDEX "absensi_siswa_scheduleId_idx" ON "absensi_siswa"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "absensi_siswa_studentId_date_scheduleId_key" ON "absensi_siswa"("studentId", "date", "scheduleId");

-- CreateIndex
CREATE INDEX "absensi_pegawai_employeeId_idx" ON "absensi_pegawai"("employeeId");

-- CreateIndex
CREATE INDEX "absensi_pegawai_shiftId_idx" ON "absensi_pegawai"("shiftId");

-- CreateIndex
CREATE INDEX "penilaian_academicYearId_idx" ON "penilaian"("academicYearId");

-- CreateIndex
CREATE INDEX "penilaian_classroomId_idx" ON "penilaian"("classroomId");

-- CreateIndex
CREATE INDEX "penilaian_studentId_idx" ON "penilaian"("studentId");

-- CreateIndex
CREATE INDEX "penilaian_subjectId_idx" ON "penilaian"("subjectId");

-- CreateIndex
CREATE INDEX "raport_academicYearId_idx" ON "raport"("academicYearId");

-- CreateIndex
CREATE INDEX "raport_classroomId_idx" ON "raport"("classroomId");

-- CreateIndex
CREATE INDEX "raport_semesterId_idx" ON "raport"("semesterId");

-- CreateIndex
CREATE INDEX "raport_studentId_idx" ON "raport"("studentId");

-- CreateIndex
CREATE INDEX "ppdb_pendaftaran_gradeAppliedId_idx" ON "ppdb_pendaftaran"("gradeAppliedId");

-- CreateIndex
CREATE INDEX "aturan_biaya_gradeId_idx" ON "aturan_biaya"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "tagihan_code_key" ON "tagihan"("code");

-- CreateIndex
CREATE INDEX "tagihan_academicYearId_idx" ON "tagihan"("academicYearId");

-- CreateIndex
CREATE INDEX "tagihan_studentId_idx" ON "tagihan"("studentId");

-- CreateIndex
CREATE INDEX "item_tagihan_invoiceId_idx" ON "item_tagihan"("invoiceId");

-- CreateIndex
CREATE INDEX "pembayaran_invoiceId_idx" ON "pembayaran"("invoiceId");

-- CreateIndex
CREATE INDEX "diskon_invoiceId_idx" ON "diskon"("invoiceId");

-- CreateIndex
CREATE INDEX "upaya_pembayaran_invoiceId_idx" ON "upaya_pembayaran"("invoiceId");

-- CreateIndex
CREATE INDEX "pengembalian_dana_paymentId_idx" ON "pengembalian_dana"("paymentId");

-- CreateIndex
CREATE INDEX "buku_kas_date_category_idx" ON "buku_kas"("date", "category");

-- CreateIndex
CREATE UNIQUE INDEX "keu_akun_code_key" ON "keu_akun"("code");

-- CreateIndex
CREATE INDEX "keu_akun_type_isActive_idx" ON "keu_akun"("type", "isActive");

-- CreateIndex
CREATE INDEX "keu_akun_parentId_idx" ON "keu_akun"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "keu_rekening_kas_bank_code_key" ON "keu_rekening_kas_bank"("code");

-- CreateIndex
CREATE INDEX "keu_rekening_kas_bank_type_isActive_idx" ON "keu_rekening_kas_bank"("type", "isActive");

-- CreateIndex
CREATE INDEX "keu_transaksi_operasional_txnDate_kind_idx" ON "keu_transaksi_operasional"("txnDate", "kind");

-- CreateIndex
CREATE INDEX "keu_transaksi_operasional_approvalStatus_txnDate_idx" ON "keu_transaksi_operasional"("approvalStatus", "txnDate");

-- CreateIndex
CREATE INDEX "keu_transaksi_operasional_accountId_txnDate_idx" ON "keu_transaksi_operasional"("accountId", "txnDate");

-- CreateIndex
CREATE INDEX "keu_transaksi_operasional_cashBankAccountId_txnDate_idx" ON "keu_transaksi_operasional"("cashBankAccountId", "txnDate");

-- CreateIndex
CREATE INDEX "keu_transaksi_operasional_transferPairId_idx" ON "keu_transaksi_operasional"("transferPairId");

-- CreateIndex
CREATE INDEX "keu_lock_periode_startDate_endDate_idx" ON "keu_lock_periode"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "keu_anggaran_periodStart_periodEnd_idx" ON "keu_anggaran"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "keu_anggaran_kind_periodStart_periodEnd_idx" ON "keu_anggaran"("kind", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "keu_anggaran_accountId_kind_periodStart_idx" ON "keu_anggaran"("accountId", "kind", "periodStart");

-- CreateIndex
CREATE INDEX "keu_anggaran_cashBankAccountId_kind_periodStart_idx" ON "keu_anggaran"("cashBankAccountId", "kind", "periodStart");

-- CreateIndex
CREATE INDEX "beasiswa_studentId_idx" ON "beasiswa"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "tabungan_akun_studentId_key" ON "tabungan_akun"("studentId");

-- CreateIndex
CREATE INDEX "tabungan_transaksi_accountId_idx" ON "tabungan_transaksi"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "perpus_koleksi_code_key" ON "perpus_koleksi"("code");

-- CreateIndex
CREATE UNIQUE INDEX "perpus_anggota_userId_key" ON "perpus_anggota"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "perpus_anggota_studentId_key" ON "perpus_anggota"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "perpus_barcode_barcode_key" ON "perpus_barcode"("barcode");

-- CreateIndex
CREATE INDEX "perpus_barcode_itemId_idx" ON "perpus_barcode"("itemId");

-- CreateIndex
CREATE INDEX "perpus_pinjaman_itemId_idx" ON "perpus_pinjaman"("itemId");

-- CreateIndex
CREATE INDEX "perpus_pinjaman_memberId_idx" ON "perpus_pinjaman"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "aset_kategori_name_key" ON "aset_kategori"("name");

-- CreateIndex
CREATE UNIQUE INDEX "aset_code_key" ON "aset"("code");

-- CreateIndex
CREATE INDEX "aset_categoryId_idx" ON "aset"("categoryId");

-- CreateIndex
CREATE INDEX "aset_peminjaman_assetId_idx" ON "aset_peminjaman"("assetId");

-- CreateIndex
CREATE INDEX "aset_peminjaman_borrowerUserId_idx" ON "aset_peminjaman"("borrowerUserId");

-- CreateIndex
CREATE INDEX "aset_perawatan_assetId_idx" ON "aset_perawatan"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "ekstrakurikuler_name_key" ON "ekstrakurikuler"("name");

-- CreateIndex
CREATE INDEX "ekstrakurikuler_coachTeacherId_idx" ON "ekstrakurikuler"("coachTeacherId");

-- CreateIndex
CREATE INDEX "ekstra_anggota_extracurricularId_idx" ON "ekstra_anggota"("extracurricularId");

-- CreateIndex
CREATE INDEX "ekstra_anggota_studentId_idx" ON "ekstra_anggota"("studentId");

-- CreateIndex
CREATE INDEX "ekstra_absensi_studentId_idx" ON "ekstra_absensi"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ekstra_absensi_extracurricularId_date_studentId_key" ON "ekstra_absensi"("extracurricularId", "date", "studentId");

-- CreateIndex
CREATE INDEX "ekstra_event_extracurricularId_idx" ON "ekstra_event"("extracurricularId");

-- CreateIndex
CREATE INDEX "bk_tiket_createdByUserId_idx" ON "bk_tiket"("createdByUserId");

-- CreateIndex
CREATE INDEX "bk_tiket_studentId_idx" ON "bk_tiket"("studentId");

-- CreateIndex
CREATE INDEX "bk_sesi_counselorUserId_idx" ON "bk_sesi"("counselorUserId");

-- CreateIndex
CREATE INDEX "bk_sesi_ticketId_idx" ON "bk_sesi"("ticketId");

-- CreateIndex
CREATE INDEX "bk_rujukan_ticketId_idx" ON "bk_rujukan"("ticketId");

-- CreateIndex
CREATE INDEX "lms_link_classroomId_idx" ON "lms_link"("classroomId");

-- CreateIndex
CREATE INDEX "lms_link_subjectId_idx" ON "lms_link"("subjectId");

-- CreateIndex
CREATE INDEX "ujian_classroomId_idx" ON "ujian"("classroomId");

-- CreateIndex
CREATE INDEX "ujian_subjectId_idx" ON "ujian"("subjectId");

-- CreateIndex
CREATE INDEX "ujian_pengerjaan_examId_idx" ON "ujian_pengerjaan"("examId");

-- CreateIndex
CREATE INDEX "ujian_pengerjaan_studentId_idx" ON "ujian_pengerjaan"("studentId");

-- CreateIndex
CREATE INDEX "ujian_soal_examId_idx" ON "ujian_soal"("examId");

-- CreateIndex
CREATE INDEX "dapodik_sync_batch_status_nextAttemptAt_idx" ON "dapodik_sync_batch"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "dapodik_staging_entityType_status_idx" ON "dapodik_staging"("entityType", "status");

-- CreateIndex
CREATE INDEX "dapodik_staging_batchId_entityType_idx" ON "dapodik_staging"("batchId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "dapodik_staging_batchId_entityType_externalId_key" ON "dapodik_staging"("batchId", "entityType", "externalId");

-- CreateIndex
CREATE INDEX "log_aktivitas_userId_idx" ON "log_aktivitas"("userId");

-- CreateIndex
CREATE INDEX "audit_event_type_occurredAt_idx" ON "audit_event"("type", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "wa_template_key_key" ON "wa_template"("key");

-- CreateIndex
CREATE INDEX "wa_outbox_status_sentAt_idx" ON "wa_outbox"("status", "sentAt");

-- CreateIndex
CREATE INDEX "wa_outbox_templateId_idx" ON "wa_outbox"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "cuti_tipe_name_key" ON "cuti_tipe"("name");

-- CreateIndex
CREATE INDEX "cuti_pengajuan_employeeId_idx" ON "cuti_pengajuan"("employeeId");

-- CreateIndex
CREATE INDEX "cuti_pengajuan_typeId_idx" ON "cuti_pengajuan"("typeId");

-- CreateIndex
CREATE UNIQUE INDEX "email_template_key_key" ON "email_template"("key");

-- CreateIndex
CREATE INDEX "email_outbox_status_sentAt_idx" ON "email_outbox"("status", "sentAt");

-- CreateIndex
CREATE INDEX "email_outbox_templateId_idx" ON "email_outbox"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "cms_menu_name_key" ON "cms_menu"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cms_page_slug_key" ON "cms_page"("slug");

-- CreateIndex
CREATE INDEX "cms_page_status_publishedAt_idx" ON "cms_page"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "cms_menu_item_menu_parent_order_idx" ON "cms_menu_item"("menuId", "parentId", "order");

-- CreateIndex
CREATE INDEX "cms_menu_item_pageId_idx" ON "cms_menu_item"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "cms_post_slug_key" ON "cms_post"("slug");

-- CreateIndex
CREATE INDEX "cms_post_type_status_publishedAt_idx" ON "cms_post"("type", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "cms_post_status_publishedAt_idx" ON "cms_post"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "cms_post_coverMediaId_idx" ON "cms_post"("coverMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "cms_media_key_key" ON "cms_media"("key");

-- CreateIndex
CREATE INDEX "cms_media_module_createdAt_idx" ON "cms_media"("module", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cms_category_slug_key" ON "cms_category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cms_tag_slug_key" ON "cms_tag"("slug");

-- CreateIndex
CREATE INDEX "cms_post_category_categoryId_idx" ON "cms_post_category"("categoryId");

-- CreateIndex
CREATE INDEX "cms_post_tag_tagId_idx" ON "cms_post_tag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "cms_event_slug_key" ON "cms_event"("slug");

-- CreateIndex
CREATE INDEX "cms_event_status_publishedAt_startAt_idx" ON "cms_event"("status", "publishedAt", "startAt");

-- CreateIndex
CREATE INDEX "cms_event_coverMediaId_idx" ON "cms_event"("coverMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "cms_gallery_slug_key" ON "cms_gallery"("slug");

-- CreateIndex
CREATE INDEX "cms_gallery_status_publishedAt_idx" ON "cms_gallery"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "cms_gallery_coverMediaId_idx" ON "cms_gallery"("coverMediaId");

-- CreateIndex
CREATE INDEX "cms_gallery_item_gallery_itemOrder_idx" ON "cms_gallery_item"("galleryId", "itemOrder");

-- CreateIndex
CREATE INDEX "cms_gallery_item_mediaId_idx" ON "cms_gallery_item"("mediaId");

-- CreateIndex
CREATE INDEX "cms_contact_message_status_createdAt_idx" ON "cms_contact_message"("isRead", "isResolved", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cms_setting_key_key" ON "cms_setting"("key");

-- AddForeignKey
ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "peran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peran_hak_akses" ADD CONSTRAINT "peran_hak_akses_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "hak_akses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peran_hak_akses" ADD CONSTRAINT "peran_hak_akses_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "peran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guru" ADD CONSTRAINT "guru_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "siswa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relasi_wali_siswa" ADD CONSTRAINT "relasi_wali_siswa_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relasi_wali_siswa" ADD CONSTRAINT "relasi_wali_siswa_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pegawai" ADD CONSTRAINT "pegawai_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester" ADD CONSTRAINT "semester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "tingkat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mata_pelajaran" ADD CONSTRAINT "mata_pelajaran_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "kurikulum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mata_pelajaran" ADD CONSTRAINT "mata_pelajaran_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "tingkat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran_kelas" ADD CONSTRAINT "pendaftaran_kelas_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran_kelas" ADD CONSTRAINT "pendaftaran_kelas_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran_kelas" ADD CONSTRAINT "pendaftaran_kelas_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "mata_pelajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_siswa" ADD CONSTRAINT "absensi_siswa_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_siswa" ADD CONSTRAINT "absensi_siswa_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_siswa" ADD CONSTRAINT "absensi_siswa_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "jadwal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_siswa" ADD CONSTRAINT "absensi_siswa_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_pegawai" ADD CONSTRAINT "absensi_pegawai_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi_pegawai" ADD CONSTRAINT "absensi_pegawai_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shift_pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penilaian" ADD CONSTRAINT "penilaian_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penilaian" ADD CONSTRAINT "penilaian_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penilaian" ADD CONSTRAINT "penilaian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penilaian" ADD CONSTRAINT "penilaian_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "mata_pelajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raport" ADD CONSTRAINT "raport_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raport" ADD CONSTRAINT "raport_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raport" ADD CONSTRAINT "raport_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raport" ADD CONSTRAINT "raport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppdb_pendaftaran" ADD CONSTRAINT "ppdb_pendaftaran_gradeAppliedId_fkey" FOREIGN KEY ("gradeAppliedId") REFERENCES "tingkat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aturan_biaya" ADD CONSTRAINT "aturan_biaya_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "tingkat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagihan" ADD CONSTRAINT "tagihan_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagihan" ADD CONSTRAINT "tagihan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_tagihan" ADD CONSTRAINT "item_tagihan_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "tagihan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "tagihan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diskon" ADD CONSTRAINT "diskon_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "tagihan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upaya_pembayaran" ADD CONSTRAINT "upaya_pembayaran_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "tagihan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengembalian_dana" ADD CONSTRAINT "pengembalian_dana_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "pembayaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keu_akun" ADD CONSTRAINT "keu_akun_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "keu_akun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keu_transaksi_operasional" ADD CONSTRAINT "keu_transaksi_operasional_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "keu_akun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keu_transaksi_operasional" ADD CONSTRAINT "keu_transaksi_operasional_cashBankAccountId_fkey" FOREIGN KEY ("cashBankAccountId") REFERENCES "keu_rekening_kas_bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keu_transaksi_operasional" ADD CONSTRAINT "keu_transaksi_operasional_transferPairId_fkey" FOREIGN KEY ("transferPairId") REFERENCES "keu_transaksi_operasional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keu_anggaran" ADD CONSTRAINT "keu_anggaran_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "keu_akun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keu_anggaran" ADD CONSTRAINT "keu_anggaran_cashBankAccountId_fkey" FOREIGN KEY ("cashBankAccountId") REFERENCES "keu_rekening_kas_bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beasiswa" ADD CONSTRAINT "beasiswa_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabungan_akun" ADD CONSTRAINT "tabungan_akun_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabungan_transaksi" ADD CONSTRAINT "tabungan_transaksi_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "tabungan_akun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perpus_anggota" ADD CONSTRAINT "perpus_anggota_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perpus_anggota" ADD CONSTRAINT "perpus_anggota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perpus_barcode" ADD CONSTRAINT "perpus_barcode_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "perpus_koleksi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perpus_pinjaman" ADD CONSTRAINT "perpus_pinjaman_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "perpus_koleksi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perpus_pinjaman" ADD CONSTRAINT "perpus_pinjaman_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "perpus_anggota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aset" ADD CONSTRAINT "aset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "aset_kategori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aset_peminjaman" ADD CONSTRAINT "aset_peminjaman_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "aset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aset_peminjaman" ADD CONSTRAINT "aset_peminjaman_borrowerUserId_fkey" FOREIGN KEY ("borrowerUserId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aset_perawatan" ADD CONSTRAINT "aset_perawatan_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "aset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ekstrakurikuler" ADD CONSTRAINT "ekstrakurikuler_coachTeacherId_fkey" FOREIGN KEY ("coachTeacherId") REFERENCES "guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ekstra_anggota" ADD CONSTRAINT "ekstra_anggota_extracurricularId_fkey" FOREIGN KEY ("extracurricularId") REFERENCES "ekstrakurikuler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ekstra_anggota" ADD CONSTRAINT "ekstra_anggota_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ekstra_absensi" ADD CONSTRAINT "ekstra_absensi_extracurricularId_fkey" FOREIGN KEY ("extracurricularId") REFERENCES "ekstrakurikuler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ekstra_absensi" ADD CONSTRAINT "ekstra_absensi_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ekstra_event" ADD CONSTRAINT "ekstra_event_extracurricularId_fkey" FOREIGN KEY ("extracurricularId") REFERENCES "ekstrakurikuler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bk_tiket" ADD CONSTRAINT "bk_tiket_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bk_tiket" ADD CONSTRAINT "bk_tiket_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bk_sesi" ADD CONSTRAINT "bk_sesi_counselorUserId_fkey" FOREIGN KEY ("counselorUserId") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bk_sesi" ADD CONSTRAINT "bk_sesi_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "bk_tiket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bk_rujukan" ADD CONSTRAINT "bk_rujukan_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "bk_tiket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_link" ADD CONSTRAINT "lms_link_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_link" ADD CONSTRAINT "lms_link_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "mata_pelajaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian" ADD CONSTRAINT "ujian_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian" ADD CONSTRAINT "ujian_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "mata_pelajaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_pengerjaan" ADD CONSTRAINT "ujian_pengerjaan_examId_fkey" FOREIGN KEY ("examId") REFERENCES "ujian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_pengerjaan" ADD CONSTRAINT "ujian_pengerjaan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_soal" ADD CONSTRAINT "ujian_soal_examId_fkey" FOREIGN KEY ("examId") REFERENCES "ujian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dapodik_staging" ADD CONSTRAINT "dapodik_staging_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "dapodik_sync_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_aktivitas" ADD CONSTRAINT "log_aktivitas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wa_outbox" ADD CONSTRAINT "wa_outbox_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "wa_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuti_pengajuan" ADD CONSTRAINT "cuti_pengajuan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuti_pengajuan" ADD CONSTRAINT "cuti_pengajuan_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "cuti_tipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "email_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_menu_item" ADD CONSTRAINT "cms_menu_item_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "cms_menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_menu_item" ADD CONSTRAINT "cms_menu_item_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "cms_page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_menu_item" ADD CONSTRAINT "cms_menu_item_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "cms_menu_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_post" ADD CONSTRAINT "cms_post_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "cms_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_post_category" ADD CONSTRAINT "cms_post_category_postId_fkey" FOREIGN KEY ("postId") REFERENCES "cms_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_post_category" ADD CONSTRAINT "cms_post_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "cms_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_post_tag" ADD CONSTRAINT "cms_post_tag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "cms_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_post_tag" ADD CONSTRAINT "cms_post_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "cms_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_event" ADD CONSTRAINT "cms_event_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "cms_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_gallery" ADD CONSTRAINT "cms_gallery_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "cms_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_gallery_item" ADD CONSTRAINT "cms_gallery_item_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "cms_gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_gallery_item" ADD CONSTRAINT "cms_gallery_item_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "cms_media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
