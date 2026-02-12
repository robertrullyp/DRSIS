import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { financePeriodLockCreateSchema } from "@/lib/schemas/finance";
import { writeFinanceAudit } from "@/server/finance/audit";

export async function GET(req: NextRequest) {
  const parsed = paginationSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { page, pageSize } = parsed.data;
  const [items, total] = await Promise.all([
    prisma.financePeriodLock.findMany({
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.financePeriodLock.count(),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actor = token?.sub;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = financePeriodLockCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const overlap = await tx.financePeriodLock.findFirst({
        where: {
          startDate: { lte: parsed.data.endDate },
          endDate: { gte: parsed.data.startDate },
        },
        select: { id: true, startDate: true, endDate: true },
      });
      if (overlap) {
        throw new Error("Lock period overlaps with existing lock");
      }

      const row = await tx.financePeriodLock.create({
        data: {
          startDate: parsed.data.startDate,
          endDate: parsed.data.endDate,
          reason: parsed.data.reason ?? null,
          lockedBy: actor,
        },
      });
      await writeFinanceAudit(tx, {
        actorId: actor,
        type: "finance.period-lock.created",
        entity: "FinancePeriodLock",
        entityId: row.id,
        meta: {
          startDate: row.startDate.toISOString(),
          endDate: row.endDate.toISOString(),
          reason: row.reason,
        },
      });
      return row;
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create period lock" },
      { status: 400 }
    );
  }
}
