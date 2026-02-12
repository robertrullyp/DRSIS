-- AlterTable
ALTER TABLE `keu_transaksi_operasional` ADD COLUMN `approvalStatus` ENUM('menunggu', 'disetujui', 'ditolak', 'dibatalkan') NOT NULL DEFAULT 'menunggu',
    ADD COLUMN `checkedAt` DATETIME(3) NULL,
    ADD COLUMN `checkedBy` VARCHAR(191) NULL,
    ADD COLUMN `rejectedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedBy` VARCHAR(191) NULL,
    ADD COLUMN `rejectedReason` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `keu_lock_periode` (
    `id` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `lockedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `keu_lock_periode_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `keu_transaksi_operasional_approvalStatus_txnDate_idx` ON `keu_transaksi_operasional`(`approvalStatus`, `txnDate`);
