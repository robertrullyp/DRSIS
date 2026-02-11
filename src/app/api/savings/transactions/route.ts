import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { savingsTxnCreateSchema } from "@/lib/schemas/savings";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId") || undefined;
  const where: Record<string, unknown> = {};
  if (accountId) (where as any).accountId = accountId;
  const startStr = req.nextUrl.searchParams.get("start") || undefined;
  const endStr = req.nextUrl.searchParams.get("end") || undefined;
  if (startStr && endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) (where as any).createdAt = { gte: start, lte: end };
  }
  const items = await prisma.savingsTransaction.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = savingsTxnCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { accountId, type, amount, requestedBy } = parsed.data;
  if (type === "WITHDRAWAL") {
    // create pending withdraw, require approval
    const created = await prisma.savingsTransaction.create({ data: { accountId, type, amount, requestedBy: requestedBy ?? null } });
    return NextResponse.json({ ok: true, pending: true, id: created.id }, { status: 201 });
  }
  // immediate apply for DEPOSIT/ADJUSTMENT
  const result = await prisma.$transaction(async (tx) => {
    const acc = await tx.savingsAccount.findUniqueOrThrow({ where: { id: accountId } });
    let newBalance = acc.balance;
    newBalance += amount; // deposit/adjustment adds
    await tx.savingsTransaction.create({ data: { accountId, type, amount, requestedBy: requestedBy ?? null, approvedBy: requestedBy ?? null } });
    await tx.savingsAccount.update({ where: { id: accountId }, data: { balance: newBalance } });
    return { balance: newBalance };
  });
  return NextResponse.json(result, { status: 201 });
}
