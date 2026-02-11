import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const txn = await prisma.savingsTransaction.findUnique({ where: { id } });
  if (!txn) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (txn.approvedBy) return NextResponse.json({ error: "already approved" }, { status: 400 });
  await prisma.savingsTransaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

