-- CreateTable
CREATE TABLE `keu_anggaran` (
    `id` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `kind` ENUM('INCOME', 'EXPENSE') NOT NULL,
    `amount` INTEGER NOT NULL,
    `notes` VARCHAR(191) NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `cashBankAccountId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `keu_anggaran_periodStart_periodEnd_idx`(`periodStart`, `periodEnd`),
    INDEX `keu_anggaran_kind_periodStart_periodEnd_idx`(`kind`, `periodStart`, `periodEnd`),
    INDEX `keu_anggaran_accountId_kind_periodStart_idx`(`accountId`, `kind`, `periodStart`),
    INDEX `keu_anggaran_cashBankAccountId_kind_periodStart_idx`(`cashBankAccountId`, `kind`, `periodStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `keu_anggaran` ADD CONSTRAINT `keu_anggaran_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `keu_akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `keu_anggaran` ADD CONSTRAINT `keu_anggaran_cashBankAccountId_fkey` FOREIGN KEY (`cashBankAccountId`) REFERENCES `keu_rekening_kas_bank`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
