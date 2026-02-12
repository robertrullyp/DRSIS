import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { writeFinanceAudit } from "@/server/finance/audit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actor = token?.sub;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.financePeriodLock.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.financePeriodLock.delete({ where: { id } });
    await writeFinanceAudit(tx, {
      actorId: actor,
      type: "finance.period-lock.deleted",
      entity: "FinancePeriodLock",
      entityId: id,
      meta: {
        startDate: existing.startDate.toISOString(),
        endDate: existing.endDate.toISOString(),
        reason: existing.reason,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
