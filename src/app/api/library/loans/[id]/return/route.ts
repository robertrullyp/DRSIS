import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { writeAuditEvent } from "@/server/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const setting = (await prisma.libSetting.findFirst()) || (await prisma.libSetting.create({ data: {} }));
  const now = new Date();
  const loan = await prisma.libLoan.findUnique({ where: { id }, include: { item: true } });
  if (!loan) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (loan.returnedAt) return NextResponse.json(loan);
  const finePerDay = setting.finePerDay ?? 0;
  const overdueDays = loan.dueAt && now > loan.dueAt ? Math.ceil((now.getTime() - loan.dueAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const fine = Math.max(0, overdueDays * finePerDay);
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.libLoan.update({ where: { id }, data: { returnedAt: now, fine } });
    await tx.libItem.update({ where: { id: loan.itemId }, data: { available: (loan.item.available ?? 0) + 1 } });
    return u;
  });
  await writeAuditEvent(prisma, {
    actorId,
    type: "library.loan.return",
    entity: "LibLoan",
    entityId: id,
    meta: { itemId: loan.itemId, memberId: loan.memberId, fine, returnedAt: now.toISOString() },
  });
  return NextResponse.json(updated);
}
