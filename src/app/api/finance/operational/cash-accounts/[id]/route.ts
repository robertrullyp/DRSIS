import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cashBankAccountUpdateSchema } from "@/lib/schemas/finance";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.cashBankAccount.findUnique({
    where: { id },
    include: {
      _count: { select: { txns: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = cashBankAccountUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  try {
    const updated = await prisma.cashBankAccount.update({
      where: { id },
      data: {
        name: parsed.data.name?.trim(),
        type: parsed.data.type,
        bankName:
          typeof parsed.data.bankName === "undefined"
            ? undefined
            : parsed.data.bankName?.trim() || null,
        accountNumber:
          typeof parsed.data.accountNumber === "undefined"
            ? undefined
            : parsed.data.accountNumber?.trim() || null,
        ownerName:
          typeof parsed.data.ownerName === "undefined"
            ? undefined
            : parsed.data.ownerName?.trim() || null,
        isActive: parsed.data.isActive,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update account" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.cashBankAccount.findUnique({
    where: { id },
    include: { _count: { select: { txns: true } } },
  });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (item._count.txns > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete cash/bank account with transactions. Deactivate it instead.",
      },
      { status: 400 }
    );
  }
  await prisma.cashBankAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
