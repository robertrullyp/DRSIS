import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { discountCreateSchema } from "@/lib/schemas/finance";
import { recalculateInvoiceStatus } from "@/server/finance/invoice-balance";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const items = await prisma.discount.findMany({
    where: { invoiceId: id },
    orderBy: { id: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = discountCreateSchema.safeParse({ ...body, invoiceId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findUniqueOrThrow({ where: { id } });
      if (inv.status === "VOID") {
        throw new Error("Cannot add discount to void invoice");
      }
      const created = await tx.discount.create({ data: parsed.data });
      const { status, balance } = await recalculateInvoiceStatus(tx, id);
      return { created, status, balance };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discount failed" },
      { status: 400 }
    );
  }
}
