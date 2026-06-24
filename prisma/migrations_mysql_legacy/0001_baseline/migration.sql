-- CreateTable
CREATE TABLE `profil_sekolah` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `npsn` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `principal` VARCHAR(191) NULL,
    `accreditation` VARCHAR(191) NULL,
    `motto` VARCHAR(191) NULL,
    `vision` VARCHAR(191) NULL,
    `mission` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `profil_sekolah_npsn_key`(`npsn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengguna` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `status` ENUM('aktif', 'nonaktif', 'ditangguhkan') NOT NULL DEFAULT 'aktif',
    `passwordHash` VARCHAR(191) NULL,
    `roleId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pengguna_email_key`(`email`),
    UNIQUE INDEX `pengguna_phone_key`(`phone`),
    INDEX `pengguna_roleId_fkey`(`roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peran` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `peran_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hak_akses` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `hak_akses_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peran_hak_akses` (
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,

    INDEX `peran_hak_akses_permissionId_fkey`(`permissionId`),
    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guru` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nidn` VARCHAR(191) NULL,
    `hireDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `guru_userId_key`(`userId`),
    UNIQUE INDEX `guru_nidn_key`(`nidn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `siswa` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nis` VARCHAR(191) NULL,
    `nisn` VARCHAR(191) NULL,
    `photoUrl` VARCHAR(191) NULL,
    `gender` ENUM('laki_laki', 'perempuan', 'lainnya') NULL,
    `birthDate` DATETIME(3) NULL,
    `startYear` INTEGER NULL,
    `guardianName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `siswa_userId_key`(`userId`),
    UNIQUE INDEX `siswa_nis_key`(`nis`),
    UNIQUE INDEX `siswa_nisn_key`(`nisn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `relasi_wali_siswa` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `guardianUserId` VARCHAR(191) NOT NULL,
    `relation` ENUM('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER') NOT NULL DEFAULT 'GUARDIAN',
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `relasi_wali_siswa_guardianUserId_fkey`(`guardianUserId`),
    UNIQUE INDEX `relasi_wali_siswa_studentId_guardianUserId_key`(`studentId`, `guardianUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pegawai` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `joinDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pegawai_userId_key`(`userId`),
    UNIQUE INDEX `pegawai_nik_key`(`nik`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tahun_ajaran` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `tahun_ajaran_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semester` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `number` INTEGER NULL,
    `academicYearId` VARCHAR(191) NOT NULL,

    INDEX `semester_academicYearId_fkey`(`academicYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tingkat` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `tingkat_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kelas` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `gradeId` VARCHAR(191) NOT NULL,
    `homeroomTeacherId` VARCHAR(191) NULL,
    `academicYearId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `kelas_code_key`(`code`),
    INDEX `kelas_academicYearId_fkey`(`academicYearId`),
    INDEX `kelas_gradeId_fkey`(`gradeId`),
    INDEX `kelas_homeroomTeacherId_fkey`(`homeroomTeacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mata_pelajaran` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `gradeId` VARCHAR(191) NULL,
    `curriculumId` VARCHAR(191) NULL,

    UNIQUE INDEX `mata_pelajaran_code_key`(`code`),
    INDEX `mata_pelajaran_curriculumId_fkey`(`curriculumId`),
    INDEX `mata_pelajaran_gradeId_fkey`(`gradeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kurikulum` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `year` INTEGER NULL,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `kurikulum_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pendaftaran_kelas` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classroomId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pendaftaran_kelas_academicYearId_fkey`(`academicYearId`),
    INDEX `pendaftaran_kelas_classroomId_fkey`(`classroomId`),
    UNIQUE INDEX `pendaftaran_kelas_studentId_academicYearId_key`(`studentId`, `academicYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jadwal` (
    `id` VARCHAR(191) NOT NULL,
    `classroomId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,

    INDEX `jadwal_classroomId_fkey`(`classroomId`),
    INDEX `jadwal_subjectId_fkey`(`subjectId`),
    INDEX `jadwal_teacherId_fkey`(`teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `absensi_siswa` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classroomId` VARCHAR(191) NOT NULL,
    `scheduleId` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('hadir', 'izin', 'sakit', 'alfa', 'terlambat') NOT NULL,
    `notes` VARCHAR(191) NULL,
    `recordedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `absensi_siswa_classroomId_fkey`(`classroomId`),
    INDEX `absensi_siswa_recordedById_fkey`(`recordedById`),
    INDEX `absensi_siswa_scheduleId_fkey`(`scheduleId`),
    UNIQUE INDEX `absensi_siswa_studentId_date_scheduleId_key`(`studentId`, `date`, `scheduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shift_pegawai` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `absensi_pegawai` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `shiftId` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('hadir', 'izin', 'sakit', 'alfa', 'terlambat') NOT NULL,
    `checkInAt` DATETIME(3) NULL,
    `checkOutAt` DATETIME(3) NULL,
    `method` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `absensi_pegawai_employeeId_fkey`(`employeeId`),
    INDEX `absensi_pegawai_shiftId_fkey`(`shiftId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penilaian` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `classroomId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1,
    `score` DOUBLE NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `penilaian_academicYearId_fkey`(`academicYearId`),
    INDEX `penilaian_classroomId_fkey`(`classroomId`),
    INDEX `penilaian_studentId_fkey`(`studentId`),
    INDEX `penilaian_subjectId_fkey`(`subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `raport` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classroomId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `semesterId` VARCHAR(191) NOT NULL,
    `overallScore` DOUBLE NULL,
    `remarks` VARCHAR(191) NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `validatedById` VARCHAR(191) NULL,
    `validatedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `raport_academicYearId_fkey`(`academicYearId`),
    INDEX `raport_classroomId_fkey`(`classroomId`),
    INDEX `raport_semesterId_fkey`(`semesterId`),
    INDEX `raport_studentId_fkey`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ppdb_pendaftaran` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `gradeAppliedId` VARCHAR(191) NULL,
    `documents` LONGTEXT NULL,
    `score` DOUBLE NULL,
    `status` ENUM('menunggu', 'terverifikasi', 'ditolak', 'diterima', 'terdaftar') NOT NULL DEFAULT 'menunggu',
    `verifiedById` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `decisionAt` DATETIME(3) NULL,
    `enrolledStudentId` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ppdb_pendaftaran_gradeAppliedId_fkey`(`gradeAppliedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aturan_biaya` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `gradeId` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `recurring` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,

    INDEX `aturan_biaya_gradeId_fkey`(`gradeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tagihan` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `status` ENUM('draf', 'terbuka', 'parsial', 'lunas', 'batal') NOT NULL DEFAULT 'terbuka',
    `total` INTEGER NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tagihan_code_key`(`code`),
    INDEX `tagihan_academicYearId_fkey`(`academicYearId`),
    INDEX `tagihan_studentId_fkey`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_tagihan` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,

    INDEX `item_tagihan_invoiceId_fkey`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pembayaran` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `method` ENUM('tunai', 'transfer', 'gateway', 'beasiswa', 'penyesuaian') NOT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reference` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,

    INDEX `pembayaran_invoiceId_fkey`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diskon` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,

    INDEX `diskon_invoiceId_fkey`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `upaya_pembayaran` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `gateway` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `payload` LONGTEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `upaya_pembayaran_invoiceId_fkey`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengembalian_dana` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,
    `processedBy` VARCHAR(191) NULL,

    INDEX `pengembalian_dana_paymentId_fkey`(`paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buku_kas` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `kind` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `memo` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,

    INDEX `buku_kas_date_category_idx`(`date`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beasiswa` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,

    INDEX `beasiswa_studentId_fkey`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tabungan_akun` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `balance` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tabungan_akun_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tabungan_transaksi` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `type` ENUM('setoran', 'penarikan', 'penyesuaian') NOT NULL,
    `amount` INTEGER NOT NULL,
    `requestedBy` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tabungan_transaksi_accountId_fkey`(`accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perpus_koleksi` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `author` VARCHAR(191) NULL,
    `publisher` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `copies` INTEGER NOT NULL DEFAULT 1,
    `available` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `perpus_koleksi_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perpus_anggota` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `perpus_anggota_userId_key`(`userId`),
    UNIQUE INDEX `perpus_anggota_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perpus_barcode` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `barcode` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `perpus_barcode_barcode_key`(`barcode`),
    INDEX `perpus_barcode_itemId_fkey`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perpus_pengaturan` (
    `id` VARCHAR(191) NOT NULL,
    `maxLoans` INTEGER NOT NULL DEFAULT 3,
    `loanDays` INTEGER NOT NULL DEFAULT 7,
    `finePerDay` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perpus_pinjaman` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `borrowedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueAt` DATETIME(3) NOT NULL,
    `returnedAt` DATETIME(3) NULL,
    `fine` INTEGER NOT NULL DEFAULT 0,

    INDEX `perpus_pinjaman_itemId_fkey`(`itemId`),
    INDEX `perpus_pinjaman_memberId_fkey`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aset_kategori` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `aset_kategori_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aset` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `acquisitionDate` DATETIME(3) NULL,
    `value` INTEGER NULL,
    `depreciationRate` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `aset_code_key`(`code`),
    INDEX `aset_categoryId_fkey`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aset_peminjaman` (
    `id` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `borrowerUserId` VARCHAR(191) NOT NULL,
    `borrowedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueAt` DATETIME(3) NULL,
    `returnedAt` DATETIME(3) NULL,

    INDEX `aset_peminjaman_assetId_fkey`(`assetId`),
    INDEX `aset_peminjaman_borrowerUserId_fkey`(`borrowerUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aset_perawatan` (
    `id` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cost` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,

    INDEX `aset_perawatan_assetId_fkey`(`assetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ekstrakurikuler` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `coachTeacherId` VARCHAR(191) NULL,

    UNIQUE INDEX `ekstrakurikuler_name_key`(`name`),
    INDEX `ekstrakurikuler_coachTeacherId_fkey`(`coachTeacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ekstra_anggota` (
    `id` VARCHAR(191) NOT NULL,
    `extracurricularId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ekstra_anggota_extracurricularId_fkey`(`extracurricularId`),
    INDEX `ekstra_anggota_studentId_fkey`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ekstra_absensi` (
    `id` VARCHAR(191) NOT NULL,
    `extracurricularId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `status` ENUM('hadir', 'izin', 'sakit', 'alfa', 'terlambat') NOT NULL,

    INDEX `ekstra_absensi_studentId_fkey`(`studentId`),
    UNIQUE INDEX `ekstra_absensi_extracurricularId_date_studentId_key`(`extracurricularId`, `date`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ekstra_event` (
    `id` VARCHAR(191) NOT NULL,
    `extracurricularId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NULL,
    `result` VARCHAR(191) NULL,

    INDEX `ekstra_event_extracurricularId_fkey`(`extracurricularId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bk_tiket` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bk_tiket_createdByUserId_fkey`(`createdByUserId`),
    INDEX `bk_tiket_studentId_fkey`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bk_sesi` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `counselorUserId` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `bk_sesi_counselorUserId_fkey`(`counselorUserId`),
    INDEX `bk_sesi_ticketId_fkey`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bk_rujukan` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `referredTo` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bk_rujukan_ticketId_fkey`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lms_link` (
    `id` VARCHAR(191) NOT NULL,
    `external` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `classroomId` VARCHAR(191) NULL,
    `subjectId` VARCHAR(191) NULL,

    INDEX `lms_link_classroomId_fkey`(`classroomId`),
    INDEX `lms_link_subjectId_fkey`(`subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ujian` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NULL,
    `classroomId` VARCHAR(191) NULL,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,

    INDEX `ujian_classroomId_fkey`(`classroomId`),
    INDEX `ujian_subjectId_fkey`(`subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ujian_pengerjaan` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `score` DOUBLE NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,

    INDEX `ujian_pengerjaan_examId_fkey`(`examId`),
    INDEX `ujian_pengerjaan_studentId_fkey`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ujian_soal` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `options` LONGTEXT NULL,
    `answer` LONGTEXT NULL,

    INDEX `ujian_soal_examId_fkey`(`examId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lms_skor` (
    `id` VARCHAR(191) NOT NULL,
    `linkId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_aktivitas` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `data` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `log_aktivitas_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_event` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `meta` LONGTEXT NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_event_type_occurredAt_idx`(`type`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wa_template` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `variables` LONGTEXT NULL,

    UNIQUE INDEX `wa_template_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wa_outbox` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `to` VARCHAR(191) NOT NULL,
    `payload` LONGTEXT NULL,
    `status` ENUM('menunggu', 'terkirim', 'tersampaikan', 'gagal', 'dibatalkan') NOT NULL DEFAULT 'menunggu',
    `providerMsgId` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `nextAttemptAt` DATETIME(3) NULL,

    INDEX `wa_outbox_status_sentAt_idx`(`status`, `sentAt`),
    INDEX `wa_outbox_templateId_fkey`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuti_tipe` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `maxDaysPerYear` INTEGER NULL,
    `requiresApproval` BOOLEAN NOT NULL DEFAULT true,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `countsAsPresence` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `cuti_tipe_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuti_pengajuan` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `days` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,
    `status` ENUM('menunggu', 'disetujui', 'ditolak', 'dibatalkan') NOT NULL DEFAULT 'menunggu',
    `decidedById` VARCHAR(191) NULL,
    `decidedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cuti_pengajuan_employeeId_fkey`(`employeeId`),
    INDEX `cuti_pengajuan_typeId_fkey`(`typeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_template` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `variables` LONGTEXT NULL,

    UNIQUE INDEX `email_template_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_outbox` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `to` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NULL,
    `payload` LONGTEXT NULL,
    `status` ENUM('menunggu', 'terkirim', 'tersampaikan', 'gagal', 'dibatalkan') NOT NULL DEFAULT 'menunggu',
    `providerMsgId` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `nextAttemptAt` DATETIME(3) NULL,

    INDEX `email_outbox_status_sentAt_idx`(`status`, `sentAt`),
    INDEX `email_outbox_templateId_fkey`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_menu` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_menu_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_page` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `excerpt` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `publishedBy` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_page_slug_key`(`slug`),
    INDEX `cms_page_status_publishedAt_idx`(`status`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_menu_item` (
    `id` VARCHAR(191) NOT NULL,
    `menuId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `label` VARCHAR(191) NOT NULL,
    `type` ENUM('INTERNAL', 'EXTERNAL', 'PAGE', 'CATEGORY', 'TAG') NOT NULL DEFAULT 'INTERNAL',
    `href` VARCHAR(191) NULL,
    `pageId` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cms_menu_item_menu_parent_order_idx`(`menuId`, `parentId`, `order`),
    INDEX `cms_menu_item_pageId_fkey`(`pageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_post` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('NEWS', 'ARTICLE', 'ANNOUNCEMENT') NOT NULL DEFAULT 'NEWS',
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` VARCHAR(191) NULL,
    `content` LONGTEXT NOT NULL,
    `coverMediaId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `publishedBy` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_post_slug_key`(`slug`),
    INDEX `cms_post_type_status_publishedAt_idx`(`type`, `status`, `publishedAt`),
    INDEX `cms_post_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `cms_post_coverMediaId_fkey`(`coverMediaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_media` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL DEFAULT '',
    `url` VARCHAR(191) NULL,
    `mime` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `alt` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `module` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_media_key_key`(`key`),
    INDEX `cms_media_module_createdAt_idx`(`module`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_category_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_tag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_tag_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_post_category` (
    `postId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,

    INDEX `cms_post_category_categoryId_fkey`(`categoryId`),
    PRIMARY KEY (`postId`, `categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_post_tag` (
    `postId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    INDEX `cms_post_tag_tagId_fkey`(`tagId`),
    PRIMARY KEY (`postId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_event` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `location` VARCHAR(191) NULL,
    `startAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endAt` DATETIME(3) NULL,
    `coverMediaId` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `publishedBy` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_event_slug_key`(`slug`),
    INDEX `cms_event_status_publishedAt_startAt_idx`(`status`, `publishedAt`, `startAt`),
    INDEX `cms_event_coverMediaId_fkey`(`coverMediaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_gallery` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `coverMediaId` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `publishedBy` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_gallery_slug_key`(`slug`),
    INDEX `cms_gallery_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `cms_gallery_coverMediaId_fkey`(`coverMediaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_gallery_item` (
    `id` VARCHAR(191) NOT NULL,
    `galleryId` VARCHAR(191) NOT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `itemOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cms_gallery_item_gallery_itemOrder_idx`(`galleryId`, `itemOrder`),
    INDEX `cms_gallery_item_mediaId_fkey`(`mediaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_contact_message` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `message` LONGTEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `metaJson` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cms_contact_message_status_createdAt_idx`(`isRead`, `isResolved`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_setting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_setting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pengguna` ADD CONSTRAINT `pengguna_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `peran`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peran_hak_akses` ADD CONSTRAINT `peran_hak_akses_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `hak_akses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peran_hak_akses` ADD CONSTRAINT `peran_hak_akses_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `peran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guru` ADD CONSTRAINT `guru_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `siswa` ADD CONSTRAINT `siswa_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relasi_wali_siswa` ADD CONSTRAINT `relasi_wali_siswa_guardianUserId_fkey` FOREIGN KEY (`guardianUserId`) REFERENCES `pengguna`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relasi_wali_siswa` ADD CONSTRAINT `relasi_wali_siswa_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pegawai` ADD CONSTRAINT `pegawai_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semester` ADD CONSTRAINT `semester_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `tahun_ajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas` ADD CONSTRAINT `kelas_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `tahun_ajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas` ADD CONSTRAINT `kelas_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `tingkat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas` ADD CONSTRAINT `kelas_homeroomTeacherId_fkey` FOREIGN KEY (`homeroomTeacherId`) REFERENCES `guru`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mata_pelajaran` ADD CONSTRAINT `mata_pelajaran_curriculumId_fkey` FOREIGN KEY (`curriculumId`) REFERENCES `kurikulum`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mata_pelajaran` ADD CONSTRAINT `mata_pelajaran_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `tingkat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pendaftaran_kelas` ADD CONSTRAINT `pendaftaran_kelas_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `tahun_ajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pendaftaran_kelas` ADD CONSTRAINT `pendaftaran_kelas_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pendaftaran_kelas` ADD CONSTRAINT `pendaftaran_kelas_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jadwal` ADD CONSTRAINT `jadwal_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jadwal` ADD CONSTRAINT `jadwal_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `mata_pelajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jadwal` ADD CONSTRAINT `jadwal_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `guru`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensi_siswa` ADD CONSTRAINT `absensi_siswa_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensi_siswa` ADD CONSTRAINT `absensi_siswa_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `guru`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensi_siswa` ADD CONSTRAINT `absensi_siswa_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `jadwal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensi_siswa` ADD CONSTRAINT `absensi_siswa_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensi_pegawai` ADD CONSTRAINT `absensi_pegawai_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `pegawai`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensi_pegawai` ADD CONSTRAINT `absensi_pegawai_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `shift_pegawai`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penilaian` ADD CONSTRAINT `penilaian_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `tahun_ajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penilaian` ADD CONSTRAINT `penilaian_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penilaian` ADD CONSTRAINT `penilaian_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penilaian` ADD CONSTRAINT `penilaian_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `mata_pelajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `raport` ADD CONSTRAINT `raport_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `tahun_ajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `raport` ADD CONSTRAINT `raport_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `raport` ADD CONSTRAINT `raport_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `semester`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `raport` ADD CONSTRAINT `raport_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ppdb_pendaftaran` ADD CONSTRAINT `ppdb_pendaftaran_gradeAppliedId_fkey` FOREIGN KEY (`gradeAppliedId`) REFERENCES `tingkat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aturan_biaya` ADD CONSTRAINT `aturan_biaya_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `tingkat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `tagihan_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `tahun_ajaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `tagihan_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_tagihan` ADD CONSTRAINT `item_tagihan_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `tagihan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembayaran` ADD CONSTRAINT `pembayaran_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `tagihan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diskon` ADD CONSTRAINT `diskon_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `tagihan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `upaya_pembayaran` ADD CONSTRAINT `upaya_pembayaran_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `tagihan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengembalian_dana` ADD CONSTRAINT `pengembalian_dana_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `pembayaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beasiswa` ADD CONSTRAINT `beasiswa_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tabungan_akun` ADD CONSTRAINT `tabungan_akun_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tabungan_transaksi` ADD CONSTRAINT `tabungan_transaksi_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `tabungan_akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perpus_anggota` ADD CONSTRAINT `perpus_anggota_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perpus_anggota` ADD CONSTRAINT `perpus_anggota_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `pengguna`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perpus_barcode` ADD CONSTRAINT `perpus_barcode_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `perpus_koleksi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perpus_pinjaman` ADD CONSTRAINT `perpus_pinjaman_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `perpus_koleksi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perpus_pinjaman` ADD CONSTRAINT `perpus_pinjaman_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `perpus_anggota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aset` ADD CONSTRAINT `aset_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `aset_kategori`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aset_peminjaman` ADD CONSTRAINT `aset_peminjaman_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `aset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aset_peminjaman` ADD CONSTRAINT `aset_peminjaman_borrowerUserId_fkey` FOREIGN KEY (`borrowerUserId`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aset_perawatan` ADD CONSTRAINT `aset_perawatan_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `aset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ekstrakurikuler` ADD CONSTRAINT `ekstrakurikuler_coachTeacherId_fkey` FOREIGN KEY (`coachTeacherId`) REFERENCES `guru`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ekstra_anggota` ADD CONSTRAINT `ekstra_anggota_extracurricularId_fkey` FOREIGN KEY (`extracurricularId`) REFERENCES `ekstrakurikuler`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ekstra_anggota` ADD CONSTRAINT `ekstra_anggota_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ekstra_absensi` ADD CONSTRAINT `ekstra_absensi_extracurricularId_fkey` FOREIGN KEY (`extracurricularId`) REFERENCES `ekstrakurikuler`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ekstra_absensi` ADD CONSTRAINT `ekstra_absensi_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ekstra_event` ADD CONSTRAINT `ekstra_event_extracurricularId_fkey` FOREIGN KEY (`extracurricularId`) REFERENCES `ekstrakurikuler`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bk_tiket` ADD CONSTRAINT `bk_tiket_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bk_tiket` ADD CONSTRAINT `bk_tiket_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bk_sesi` ADD CONSTRAINT `bk_sesi_counselorUserId_fkey` FOREIGN KEY (`counselorUserId`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bk_sesi` ADD CONSTRAINT `bk_sesi_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `bk_tiket`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bk_rujukan` ADD CONSTRAINT `bk_rujukan_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `bk_tiket`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_link` ADD CONSTRAINT `lms_link_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `kelas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lms_link` ADD CONSTRAINT `lms_link_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `mata_pelajaran`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ujian` ADD CONSTRAINT `ujian_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `kelas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ujian` ADD CONSTRAINT `ujian_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `mata_pelajaran`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ujian_pengerjaan` ADD CONSTRAINT `ujian_pengerjaan_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `ujian`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ujian_pengerjaan` ADD CONSTRAINT `ujian_pengerjaan_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `siswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ujian_soal` ADD CONSTRAINT `ujian_soal_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `ujian`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_aktivitas` ADD CONSTRAINT `log_aktivitas_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `pengguna`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wa_outbox` ADD CONSTRAINT `wa_outbox_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `wa_template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cuti_pengajuan` ADD CONSTRAINT `cuti_pengajuan_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `pegawai`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cuti_pengajuan` ADD CONSTRAINT `cuti_pengajuan_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `cuti_tipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_outbox` ADD CONSTRAINT `email_outbox_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `email_template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_menu_item` ADD CONSTRAINT `cms_menu_item_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `cms_menu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_menu_item` ADD CONSTRAINT `cms_menu_item_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `cms_page`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_menu_item` ADD CONSTRAINT `cms_menu_item_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `cms_menu_item`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_post` ADD CONSTRAINT `cms_post_coverMediaId_fkey` FOREIGN KEY (`coverMediaId`) REFERENCES `cms_media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_post_category` ADD CONSTRAINT `cms_post_category_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `cms_post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_post_category` ADD CONSTRAINT `cms_post_category_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `cms_category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_post_tag` ADD CONSTRAINT `cms_post_tag_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `cms_post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_post_tag` ADD CONSTRAINT `cms_post_tag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `cms_tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_event` ADD CONSTRAINT `cms_event_coverMediaId_fkey` FOREIGN KEY (`coverMediaId`) REFERENCES `cms_media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_gallery` ADD CONSTRAINT `cms_gallery_coverMediaId_fkey` FOREIGN KEY (`coverMediaId`) REFERENCES `cms_media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_gallery_item` ADD CONSTRAINT `cms_gallery_item_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `cms_gallery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_gallery_item` ADD CONSTRAINT `cms_gallery_item_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `cms_media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

