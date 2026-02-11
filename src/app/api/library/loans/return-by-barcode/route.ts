import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { barcode, memberId } = body as { barcode?: string; memberId?: string };
  if (!barcode) return NextResponse.json({ error: "barcode required" }, { status: 400 });
  const bc = await prisma.libBarcode.findUnique({ where: { barcode } });
  if (!bc) return NextResponse.json({ error: "barcode not found" }, { status: 404 });
  const setting = (await prisma.libSetting.findFirst()) || (await prisma.libSetting.create({ data: {} }));
  const now = new Date();
  const where: any = { itemId: bc.itemId, returnedAt: null };
  if (memberId) where.memberId = memberId;
  const loan = await prisma.libLoan.findFirst({ where, include: { item: true } });
  if (!loan) return NextResponse.json({ error: "active loan not found for item" }, { status: 404 });
  const finePerDay = setting.finePerDay ?? 0;
  const overdueDays = loan.dueAt && now > loan.dueAt ? Math.ceil((now.getTime() - loan.dueAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const fine = Math.max(0, overdueDays * finePerDay);
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.libLoan.update({ where: { id: loan.id }, data: { returnedAt: now, fine } });
    await tx.libItem.update({ where: { id: loan.itemId }, data: { available: (loan.item.available ?? 0) + 1 } });
    return u;
  });
  return NextResponse.json(updated);
}

