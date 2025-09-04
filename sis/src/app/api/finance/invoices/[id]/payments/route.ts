import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentCreateSchema } from "@/lib/schemas/finance";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await prisma.payment.findMany({ where: { invoiceId: id }, orderBy: { paidAt: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = paymentCreateSchema.safeParse({ ...body, invoiceId: id });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { amount, method, reference } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findUniqueOrThrow({ where: { id } });
    const pay = await tx.payment.create({ data: { invoiceId: id, amount, method, reference: reference ?? null } });
    const paidAgg = await tx.payment.aggregate({ _sum: { amount: true }, where: { invoiceId: id } });
    const paid = paidAgg._sum.amount ?? 0;
    let status: "PAID" | "PARTIAL" | "VOID" | "OPEN" = "OPEN";
    if (paid >= inv.total) status = "PAID";
    else if (paid > 0) status = "PARTIAL";
    await tx.invoice.update({ where: { id }, data: { status } });
    return pay;
  });
  return NextResponse.json(result, { status: 201 });
}

