-- CreateTable
CREATE TABLE `keu_akun` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE') NOT NULL,
    `category` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `keu_akun_code_key`(`code`),
    INDEX `keu_akun_type_isActive_idx`(`type`, `isActive`),
    INDEX `keu_akun_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `keu_rekening_kas_bank` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('CASH', 'BANK') NOT NULL,
    `bankName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `ownerName` VARCHAR(191) NULL,
    `openingBalance` INTEGER NOT NULL DEFAULT 0,
    `balance` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `keu_rekening_kas_bank_code_key`(`code`),
    INDEX `keu_rekening_kas_bank_type_isActive_idx`(`type`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `keu_transaksi_operasional` (
    `id` VARCHAR(191) NOT NULL,
    `txnDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `kind` ENUM('INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT') NOT NULL,
    `amount` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `referenceNo` VARCHAR(191) NULL,
    `proofUrl` VARCHAR(191) NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `cashBankAccountId` VARCHAR(191) NOT NULL,
    `transferPairId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `keu_transaksi_operasional_txnDate_kind_idx`(`txnDate`, `kind`),
    INDEX `keu_transaksi_operasional_accountId_txnDate_idx`(`accountId`, `txnDate`),
    INDEX `keu_transaksi_operasional_cashBankAccountId_txnDate_idx`(`cashBankAccountId`, `txnDate`),
    INDEX `keu_transaksi_operasional_transferPairId_idx`(`transferPairId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `keu_akun` ADD CONSTRAINT `keu_akun_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `keu_akun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `keu_transaksi_operasional` ADD CONSTRAINT `keu_transaksi_operasional_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `keu_akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `keu_transaksi_operasional` ADD CONSTRAINT `keu_transaksi_operasional_cashBankAccountId_fkey` FOREIGN KEY (`cashBankAccountId`) REFERENCES `keu_rekening_kas_bank`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `keu_transaksi_operasional` ADD CONSTRAINT `keu_transaksi_operasional_transferPairId_fkey` FOREIGN KEY (`transferPairId`) REFERENCES `keu_transaksi_operasional`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
