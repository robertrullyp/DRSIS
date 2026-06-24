-- CreateEnum
CREATE TYPE "AnalyticsEventSource" AS ENUM ('API', 'JOB', 'SYSTEM', 'USER');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'DANGER');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- AlterTable
ALTER TABLE "ujian_pengerjaan" ADD COLUMN "answersJson" TEXT;

-- CreateTable
CREATE TABLE "analytics_event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "entity" TEXT,
    "entityId" TEXT,
    "actorId" TEXT,
    "source" "AnalyticsEventSource" NOT NULL DEFAULT 'API',
    "payload" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_inbox" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "studentId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "readAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_event_name_occurredAt_idx" ON "analytics_event"("name", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_event_domain_occurredAt_idx" ON "analytics_event"("domain", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_event_actorId_occurredAt_idx" ON "analytics_event"("actorId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshot_name_bucket_key" ON "analytics_snapshot"("name", "bucket");

-- CreateIndex
CREATE INDEX "analytics_snapshot_name_capturedAt_idx" ON "analytics_snapshot"("name", "capturedAt");

-- CreateIndex
CREATE INDEX "notification_inbox_recipient_status_createdAt_idx" ON "notification_inbox"("recipientUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "notification_inbox_student_createdAt_idx" ON "notification_inbox"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_inbox_type_createdAt_idx" ON "notification_inbox"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_inbox" ADD CONSTRAINT "notification_inbox_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_inbox" ADD CONSTRAINT "notification_inbox_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_inbox" ADD CONSTRAINT "notification_inbox_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
