import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { financeAccountUpdateSchema } from "@/lib/schemas/finance";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.financeAccount.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, code: true, name: true } },
      children: { select: { id: true, code: true, name: true, isActive: true } },
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
  const parsed = financeAccountUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  if (parsed.data.parentId === id) {
    return NextResponse.json(
      { error: "Account cannot be parent of itself" },
      { status: 400 }
    );
  }
  if (parsed.data.parentId) {
    const parent = await prisma.financeAccount.findUnique({
      where: { id: parsed.data.parentId },
      select: { id: true, parentId: true },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Parent account not found" },
        { status: 400 }
      );
    }
    if (parent.parentId === id) {
      return NextResponse.json(
        { error: "Circular parent is not allowed" },
        { status: 400 }
      );
    }
  }

  try {
    const updated = await prisma.financeAccount.update({
      where: { id },
      data: {
        name: parsed.data.name?.trim(),
        type: parsed.data.type,
        category:
          typeof parsed.data.category === "undefined"
            ? undefined
            : parsed.data.category?.trim() || null,
        parentId:
          typeof parsed.data.parentId === "undefined"
            ? undefined
            : parsed.data.parentId || null,
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
  const account = await prisma.financeAccount.findUnique({
    where: { id },
    include: { _count: { select: { children: true, txns: true } } },
  });
  if (!account) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (account._count.children > 0 || account._count.txns > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete account with children or transactions. Deactivate it instead.",
      },
      { status: 400 }
    );
  }

  await prisma.financeAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
