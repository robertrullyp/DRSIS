import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma";

const auditEventQuerySchema = paginationSchema.extend({
  type: z.string().min(1).optional(),
  entity: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  actorId: z.string().min(1).optional(),
  from: z.string().min(1).optional(), // YYYY-MM-DD or ISO
  to: z.string().min(1).optional(),
});

function tryParseDate(value: string | undefined) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function parseMeta(meta: string | null) {
  if (!meta) return null;
  try {
    return JSON.parse(meta) as unknown;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const parsed = auditEventQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { page, pageSize, q, type, entity, entityId, actorId, from, to } =
    parsed.data;

  const fromDate = tryParseDate(from);
  const toDate = tryParseDate(to);

  const where: Prisma.AuditEventWhereInput = {};

  if (type) where.type = { contains: type };
  if (entity) where.entity = { contains: entity };
  if (entityId) where.entityId = { contains: entityId };
  if (actorId) where.actorId = { contains: actorId };

  if (fromDate || toDate) {
    where.occurredAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }

  if (q) {
    where.OR = [
      { type: { contains: q } },
      { entity: { contains: q } },
      { entityId: { contains: q } },
      { actorId: { contains: q } },
      { meta: { contains: q } },
    ];
  }

  const [itemsRaw, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: [{ occurredAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditEvent.count({ where }),
  ]);

  const items = itemsRaw.map((row) => ({
    ...row,
    metaJson: row.meta,
    meta: parseMeta(row.meta),
  }));

  return NextResponse.json({ items, total, page, pageSize });
}

