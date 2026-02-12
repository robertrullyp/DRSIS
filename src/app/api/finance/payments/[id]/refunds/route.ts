import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { refundCreateSchema } from "@/lib/schemas/finance";
import { recalculateInvoiceStatus } from "@/server/finance/invoice-balance";
import { postInvoiceRefundToOperationalLedger } from "@/server/finance/invoice-operational-posting";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const items = await prisma.refund.findMany({
    where: { paymentId: id },
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
  const parsed = refundCreateSchema.safeParse({ ...body, paymentId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const processedBy = token?.sub;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id },
        include: {
          invoice: { select: { id: true, code: true } },
        },
      });
      const refundAgg = await tx.refund.aggregate({
        where: { paymentId: id },
        _sum: { amount: true },
      });
      const existingRefunds = refundAgg._sum.amount ?? 0;
      const nextRefundTotal = existingRefunds + parsed.data.amount;
      if (nextRefundTotal > payment.amount) {
        throw new Error("Refund exceeds payment amount");
      }
      const created = await tx.refund.create({
        data: {
          paymentId: id,
          amount: parsed.data.amount,
          reason: parsed.data.reason ?? null,
          processedBy: processedBy ?? null,
        },
      });
      const ledgerTxn = await postInvoiceRefundToOperationalLedger(
        tx,
        {
          id: payment.id,
          invoiceId: payment.invoiceId,
          amount: payment.amount,
          method: payment.method,
          paidAt: payment.paidAt,
          createdById: payment.createdById,
        },
        {
          id: created.id,
          amount: created.amount,
          processedBy: created.processedBy,
        },
        payment.invoice
      );
      const { status, balance } = await recalculateInvoiceStatus(tx, payment.invoiceId);
      return {
        created,
        status,
        balance,
        invoiceId: payment.invoiceId,
        ledgerTxn,
      };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Refund failed" },
      { status: 400 }
    );
  }
}
