import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentCreateSchema } from "@/lib/schemas/finance";
import { recalculateInvoiceStatus } from "@/server/finance/invoice-balance";
import { postInvoicePaymentToOperationalLedger } from "@/server/finance/invoice-operational-posting";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await prisma.payment.findMany({
    where: { invoiceId: id },
    include: { refunds: true },
    orderBy: { paidAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = paymentCreateSchema.safeParse({ ...body, invoiceId: id });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { amount, method, reference } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findUniqueOrThrow({ where: { id } });
      if (inv.status === "VOID") {
        throw new Error("Cannot add payment to void invoice");
      }
      const pay = await tx.payment.create({ data: { invoiceId: id, amount, method, reference: reference ?? null } });
      const ledgerTxn = await postInvoicePaymentToOperationalLedger(
        tx,
        {
          id: pay.id,
          invoiceId: pay.invoiceId,
          amount: pay.amount,
          method: pay.method,
          paidAt: pay.paidAt,
          createdById: pay.createdById,
        },
        {
          id: inv.id,
          code: inv.code,
        }
      );
      const { status, balance } = await recalculateInvoiceStatus(tx, id);
      return { pay, status, balance, ledgerTxn };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 400 }
    );
  }
}
