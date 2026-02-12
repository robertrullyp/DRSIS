import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { discountUpdateSchema } from "@/lib/schemas/finance";
import { recalculateInvoiceStatus } from "@/server/finance/invoice-balance";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; discountId: string }> }
) {
  const { id, discountId } = await params;
  const body = await req.json();
  const parsed = discountUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.discount.findUniqueOrThrow({ where: { id: discountId } });
      if (existing.invoiceId !== id) throw new Error("Discount does not belong to invoice");
      const updated = await tx.discount.update({ where: { id: discountId }, data: parsed.data });
      const { status, balance } = await recalculateInvoiceStatus(tx, id);
      return { updated, status, balance };
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discount update failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; discountId: string }> }
) {
  const { id, discountId } = await params;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.discount.findUniqueOrThrow({ where: { id: discountId } });
      if (existing.invoiceId !== id) throw new Error("Discount does not belong to invoice");
      await tx.discount.delete({ where: { id: discountId } });
      const { status, balance } = await recalculateInvoiceStatus(tx, id);
      return { status, balance };
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discount delete failed" },
      { status: 400 }
    );
  }
}
