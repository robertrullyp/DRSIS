import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { memberId, barcode } = body as { memberId?: string; barcode?: string };
  if (!memberId || !barcode) return NextResponse.json({ error: "memberId and barcode required" }, { status: 400 });
  const bc = await prisma.libBarcode.findUnique({ where: { barcode } });
  if (!bc) return NextResponse.json({ error: "barcode not found" }, { status: 404 });
  // Reuse create flow via transaction similar to POST /loans
  const item = await prisma.libItem.findUnique({ where: { id: bc.itemId } });
  if (!item) return NextResponse.json({ error: "item not found" }, { status: 404 });
  if ((item.available ?? 0) <= 0) return NextResponse.json({ error: "item not available" }, { status: 400 });
  const setting = (await prisma.libSetting.findFirst()) || (await prisma.libSetting.create({ data: {} }));
  const activeLoans = await prisma.libLoan.count({ where: { memberId, returnedAt: null } });
  const maxLoans = setting.maxLoans ?? 3;
  if (activeLoans >= maxLoans) return NextResponse.json({ error: "member has reached max active loans" }, { status: 400 });

  const now = new Date();
  const due = new Date(now.getTime() + (setting.loanDays ?? 7) * 24 * 60 * 60 * 1000);
  const loan = await prisma.$transaction(async (tx) => {
    const created = await tx.libLoan.create({ data: { itemId: bc.itemId, memberId, borrowedAt: now, dueAt: due } });
    await tx.libItem.update({ where: { id: bc.itemId }, data: { available: (item.available ?? 0) - 1 } });
    return created;
  });
  return NextResponse.json(loan, { status: 201 });
}

