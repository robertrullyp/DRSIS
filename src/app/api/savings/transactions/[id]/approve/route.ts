import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const approver = (token as any)?.sub as string | undefined;
  const result = await prisma.$transaction(async (tx) => {
    const txn = await tx.savingsTransaction.findUniqueOrThrow({ where: { id } });
    if (txn.type !== "WITHDRAWAL") return txn;
    if (txn.approvedBy) return txn;
    const acc = await tx.savingsAccount.findUniqueOrThrow({ where: { id: txn.accountId } });
    if (acc.balance < txn.amount) throw new Error("Insufficient balance");
    await tx.savingsAccount.update({ where: { id: acc.id }, data: { balance: acc.balance - txn.amount } });
    return tx.savingsTransaction.update({ where: { id }, data: { approvedBy: approver ?? null } });
  });
  return NextResponse.json(result);
}
