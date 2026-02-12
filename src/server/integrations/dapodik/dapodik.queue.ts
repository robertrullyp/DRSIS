import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { isDapodikSyncEnabled, getDapodikSyncMaxAttempts, getDapodikSyncMode } from "./dapodik.config";
import type { DapodikBatchListQueryInput } from "./dapodik.dto";
import { writeAuditEvent } from "@/server/audit";

type RunnerStatus = "SUCCESS" | "RETRY" | "FAILED";

export type DapodikSyncProcessResult = {
  processed: number;
  results: Record<string, RunnerStatus>;
  skipped?: boolean;
  error?: string;
};

function clampLimit(limit: number) {
  if (!Number.isFinite(limit)) return 20;
  return Math.max(1, Math.min(50, Math.trunc(limit)));
}

function resolveNextAttempt(attempts: number) {
  // Exponential backoff with cap.
  const delayMinutes = Math.min(60, Math.pow(2, Math.max(0, attempts)) || 1);
  return new Date(Date.now() + delayMinutes * 60_000);
}

export async function enqueueDapodikSyncBatch(kind: string, requestedBy: string) {
  const created = await prisma.dapodikSyncBatch.create({
    data: {
      kind,
      status: "PENDING",
      attempts: 0,
      maxAttempts: getDapodikSyncMaxAttempts(),
      requestedBy,
      nextAttemptAt: null,
    },
  });

  await writeAuditEvent(prisma, {
    actorId: requestedBy,
    type: "dapodik.batch.enqueue",
    entity: "DapodikSyncBatch",
    entityId: created.id,
    meta: { kind: created.kind },
  });

  return created;
}

export async function listDapodikSyncBatches(query: DapodikBatchListQueryInput) {
  const { page, pageSize, q, status, kind } = query;
  const where: Prisma.DapodikSyncBatchWhereInput = {
    ...(status ? { status } : {}),
    ...(kind ? { kind } : {}),
    ...(q
      ? {
          OR: [
            { kind: { contains: q } },
            { errorMessage: { contains: q } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.dapodikSyncBatch.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dapodikSyncBatch.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function retryDapodikSyncBatch(id: string, requestedBy: string) {
  const existing = await prisma.dapodikSyncBatch.findUnique({ where: { id } });
  if (!existing) return null;

  const updated = await prisma.dapodikSyncBatch.update({
    where: { id },
    data: {
      status: "PENDING",
      attempts: 0,
      maxAttempts: getDapodikSyncMaxAttempts(),
      nextAttemptAt: null,
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
    },
  });

  await writeAuditEvent(prisma, {
    actorId: requestedBy,
    type: "dapodik.batch.retry",
    entity: "DapodikSyncBatch",
    entityId: id,
    meta: { kind: updated.kind },
  });

  return updated;
}

async function runBatchMock(batch: { id: string; kind: string }) {
  // Keep it deterministic and fast: no external IO.
  await prisma.dapodikStagingRow.deleteMany({ where: { batchId: batch.id } });
  const nowIso = new Date().toISOString();
  await prisma.dapodikStagingRow.createMany({
    data: [
      {
        batchId: batch.id,
        entityType: "school",
        externalId: `sekolah_${batch.id}`,
        status: "NEW",
        dataJson: JSON.stringify({
          sekolah_id: `sekolah_${batch.id}`,
          npsn: null,
          syncedAt: nowIso,
        }),
      },
      {
        batchId: batch.id,
        entityType: "teacher",
        externalId: `ptk_${batch.id}`,
        status: "NEW",
        dataJson: JSON.stringify({
          ptk_id: `ptk_${batch.id}`,
          email: null,
          syncedAt: nowIso,
        }),
      },
      {
        batchId: batch.id,
        entityType: "student",
        externalId: `peserta_didik_${batch.id}`,
        status: "NEW",
        dataJson: JSON.stringify({
          peserta_didik_id: `peserta_didik_${batch.id}`,
          nisn: null,
          syncedAt: nowIso,
        }),
      },
    ],
  });

  return {
    ok: true,
    meta: {
      mode: "mock",
      kind: batch.kind,
      message: "Mock sync completed (no external calls).",
      createdStagingRows: 3,
      finishedAt: new Date().toISOString(),
    } as Record<string, unknown>,
  };
}

async function runBatch(batch: { id: string; kind: string }) {
  const mode = getDapodikSyncMode();
  if (mode === "mock") return runBatchMock(batch);
  throw new Error("Dapodik sync is not configured. Set DAPODIK_SYNC_MODE=mock for demo, or implement real connector.");
}

export async function processDapodikSyncQueue(limit: number): Promise<DapodikSyncProcessResult> {
  if (!isDapodikSyncEnabled()) {
    return { processed: 0, results: {}, skipped: true };
  }

  const now = new Date();
  const results: Record<string, RunnerStatus> = {};

  try {
    const pendings = await prisma.dapodikSyncBatch.findMany({
      where: {
        status: "PENDING",
        attempts: { lt: getDapodikSyncMaxAttempts() },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      orderBy: [{ createdAt: "asc" }],
      take: clampLimit(limit),
    });

    for (const batch of pendings) {
      const startedAt = new Date();
      await prisma.dapodikSyncBatch.update({
        where: { id: batch.id },
        data: { status: "RUNNING", startedAt, errorMessage: null },
      });

      try {
        const result = await runBatch({ id: batch.id, kind: batch.kind });
        await prisma.dapodikSyncBatch.update({
          where: { id: batch.id },
          data: {
            status: "SUCCESS",
            finishedAt: new Date(),
            metaJson: result.meta ? JSON.stringify(result.meta) : null,
            errorMessage: null,
          },
        });

        await writeAuditEvent(prisma, {
          actorId: null,
          type: "dapodik.batch.success",
          entity: "DapodikSyncBatch",
          entityId: batch.id,
          meta: { kind: batch.kind },
        });

        results[batch.id] = "SUCCESS";
      } catch (error) {
        const attemptNumber = (batch.attempts ?? 0) + 1;
        const shouldFail = attemptNumber >= (batch.maxAttempts ?? getDapodikSyncMaxAttempts());
        const nextAttemptAt = shouldFail ? null : resolveNextAttempt(batch.attempts ?? 0);
        const message = error instanceof Error ? error.message : "Unknown error";

        await prisma.dapodikSyncBatch.update({
          where: { id: batch.id },
          data: {
            status: shouldFail ? "FAILED" : "PENDING",
            attempts: { increment: 1 },
            nextAttemptAt,
            errorMessage: message,
            finishedAt: shouldFail ? new Date() : null,
          },
        });

        await writeAuditEvent(prisma, {
          actorId: null,
          type: shouldFail ? "dapodik.batch.failed" : "dapodik.batch.retry",
          entity: "DapodikSyncBatch",
          entityId: batch.id,
          meta: { kind: batch.kind, message },
        });

        results[batch.id] = shouldFail ? "FAILED" : "RETRY";
      }
    }

    return { processed: Object.keys(results).length, results };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { processed: 0, results: {}, error: message };
  }
}
