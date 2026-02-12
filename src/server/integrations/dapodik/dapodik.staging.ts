import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import type { DapodikStagingListQueryInput, DapodikStagingUpdateInput } from "./dapodik.dto";
import { writeAuditEvent } from "@/server/audit";

export async function listDapodikStagingRows(query: DapodikStagingListQueryInput) {
  const { page, pageSize, q, status, entityType, batchId } = query;
  const where: Prisma.DapodikStagingRowWhereInput = {
    ...(status ? { status } : {}),
    ...(entityType ? { entityType } : {}),
    ...(batchId ? { batchId } : {}),
    ...(q
      ? {
          OR: [
            { externalId: { contains: q } },
            { entityType: { contains: q } },
            { matchedLocalId: { contains: q } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.dapodikStagingRow.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        batch: { select: { id: true, kind: true, status: true, createdAt: true } },
      },
    }),
    prisma.dapodikStagingRow.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function updateDapodikStagingRow(id: string, input: DapodikStagingUpdateInput, actorId: string) {
  const updated = await prisma.dapodikStagingRow.update({
    where: { id },
    data: {
      ...(typeof input.status !== "undefined" ? { status: input.status } : {}),
      ...(input.matchedLocalType !== undefined ? { matchedLocalType: input.matchedLocalType } : {}),
      ...(input.matchedLocalId !== undefined ? { matchedLocalId: input.matchedLocalId } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  await writeAuditEvent(prisma, {
    actorId,
    type: "dapodik.staging.update",
    entity: "DapodikStagingRow",
    entityId: id,
    meta: {
      status: updated.status,
      entityType: updated.entityType,
      externalId: updated.externalId,
      matchedLocalType: updated.matchedLocalType,
      matchedLocalId: updated.matchedLocalId,
    },
  });

  return updated;
}

