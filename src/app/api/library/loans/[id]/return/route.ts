import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  return NextResponse.json(updated);
}

