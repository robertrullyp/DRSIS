import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { paginationSchema } from "@/lib/validation";
import { writeAuditEvent } from "@/server/audit";
import { getAnalyticsSummary } from "./summary";

export const analyticsEventCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  domain: z.string().trim().min(1).max(80).optional().nullable(),
  entity: z.string().trim().min(1).max(80).optional().nullable(),
  entityId: z.string().trim().min(1).max(120).optional().nullable(),
  source: z.enum(["API", "JOB", "SYSTEM", "USER"]).default("API"),
  payload: z.record(z.string(), z.unknown()).optional().nullable(),
  occurredAt: z.coerce.date().optional(),
});

export type AnalyticsEventCreateInput = z.infer<typeof analyticsEventCreateSchema>;

export const analyticsEventListQuerySchema = paginationSchema.extend({
  name: z.string().trim().min(1).optional(),
  domain: z.string().trim().min(1).optional(),
  entity: z.string().trim().min(1).optional(),
  actorId: z.string().trim().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AnalyticsEventListQueryInput = z.infer<typeof analyticsEventListQuerySchema>;

export const analyticsSnapshotListQuerySchema = paginationSchema.extend({
  name: z.string().trim().min(1).optional(),
  bucket: z.string().trim().min(1).optional(),
});

export type AnalyticsSnapshotListQueryInput = z.infer<typeof analyticsSnapshotListQuerySchema>;

export const analyticsSnapshotCaptureSchema = z.object({
  name: z.string().trim().min(1).max(120).default("daily-summary"),
  bucket: z.string().trim().min(1).max(80).optional(),
});

export type AnalyticsSnapshotCaptureInput = z.infer<typeof analyticsSnapshotCaptureSchema>;

function safePayload(payload: Record<string, unknown> | null | undefined) {
  if (!payload) return null;
  try {
    return JSON.stringify(payload);
  } catch {
    return null;
  }
}

function parsePayload(payload: string | null) {
  if (!payload) return null;
  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return null;
  }
}

export async function recordAnalyticsEvent(input: AnalyticsEventCreateInput, actorId: string | null) {
  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.analyticsEvent.create({
      data: {
        name: input.name,
        domain: input.domain ?? null,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        actorId,
        source: input.source,
        payload: safePayload(input.payload ?? null),
        occurredAt: input.occurredAt ?? new Date(),
      },
    });

    await writeAuditEvent(tx, {
      actorId,
      type: "analytics.event.record",
      entity: "AnalyticsEvent",
      entityId: item.id,
      meta: { name: item.name, domain: item.domain, source: item.source },
    });

    return item;
  });

  return created;
}

export async function listAnalyticsEvents(query: AnalyticsEventListQueryInput) {
  const { page, pageSize, q, name, domain, entity, actorId, from, to } = query;
  const where: Prisma.AnalyticsEventWhereInput = {
    ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
    ...(domain ? { domain: { contains: domain, mode: "insensitive" } } : {}),
    ...(entity ? { entity: { contains: entity, mode: "insensitive" } } : {}),
    ...(actorId ? { actorId } : {}),
    ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { domain: { contains: q, mode: "insensitive" } },
            { entity: { contains: q, mode: "insensitive" } },
            { entityId: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [itemsRaw, total] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where,
      include: { actor: { select: { id: true, email: true, name: true } } },
      orderBy: [{ occurredAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.analyticsEvent.count({ where }),
  ]);

  const items = itemsRaw.map((item) => ({
    ...item,
    payloadJson: item.payload,
    payload: parsePayload(item.payload),
  }));

  return { items, total, page, pageSize };
}

export async function listAnalyticsSnapshots(query: AnalyticsSnapshotListQueryInput) {
  const { page, pageSize, q, name, bucket } = query;
  const where: Prisma.AnalyticsSnapshotWhereInput = {
    ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
    ...(bucket ? { bucket } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { bucket: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [itemsRaw, total] = await Promise.all([
    prisma.analyticsSnapshot.findMany({
      where,
      orderBy: [{ capturedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.analyticsSnapshot.count({ where }),
  ]);

  const items = itemsRaw.map((item) => ({
    ...item,
    payloadJson: item.payload,
    payload: parsePayload(item.payload),
  }));

  return { items, total, page, pageSize };
}

export async function captureAnalyticsSnapshot(input: AnalyticsSnapshotCaptureInput, actorId: string) {
  const summary = await getAnalyticsSummary();
  const bucket = input.bucket ?? summary.ts.slice(0, 10);
  const payload = JSON.stringify(summary);

  const snapshot = await prisma.$transaction(async (tx) => {
    const item = await tx.analyticsSnapshot.upsert({
      where: { name_bucket: { name: input.name, bucket } },
      update: { payload, capturedAt: new Date() },
      create: { name: input.name, bucket, payload },
    });

    await writeAuditEvent(tx, {
      actorId,
      type: "analytics.snapshot.capture",
      entity: "AnalyticsSnapshot",
      entityId: item.id,
      meta: { name: item.name, bucket: item.bucket },
    });

    return item;
  });

  return {
    ...snapshot,
    payloadJson: snapshot.payload,
    payload: summary,
  };
}
