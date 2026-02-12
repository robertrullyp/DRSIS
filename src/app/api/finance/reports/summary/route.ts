import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeInvoiceBalance } from "@/server/finance/invoice-balance";

export async function GET(req: NextRequest) {
  const startStr = req.nextUrl.searchParams.get("start");
  const endStr = req.nextUrl.searchParams.get("end");
  const where: Record<string, unknown> = {};
  let validRange: { start: Date; end: Date } | null = null;
  if (startStr && endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      validRange = { start, end };
      where.createdAt = { gte: start, lte: end };
    }
  }
  const [open, partial, paid, billedAgg, discountAgg, paymentAgg, refundAgg, scholarshipAgg] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      where: { ...where, status: "OPEN" },
    }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      where: { ...where, status: "PARTIAL" },
    }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      where: { ...where, status: "PAID" },
    }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      where,
    }),
    prisma.discount.aggregate({
      _sum: { amount: true },
      _count: { _all: true },
      where: {
        invoice: where,
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { _all: true },
      where: {
        invoice: where,
      },
    }),
    prisma.refund.aggregate({
      _sum: { amount: true },
      _count: { _all: true },
      where: {
        payment: {
          invoice: where,
        },
      },
    }),
    prisma.scholarship.aggregate({
      _sum: { amount: true },
      _count: { _all: true },
      where: validRange
        ? {
            startDate: {
              gte: validRange.start,
              lte: validRange.end,
            },
          }
        : {},
    }),
  ]);

  const totals = computeInvoiceBalance({
    total: billedAgg._sum.total ?? 0,
    discountTotal: discountAgg._sum.amount ?? 0,
    paymentTotal: paymentAgg._sum.amount ?? 0,
    refundTotal: refundAgg._sum.amount ?? 0,
  });

  return NextResponse.json({
    totals,
    billed: { amount: billedAgg._sum.total ?? 0, count: billedAgg._count._all },
    discounts: { amount: discountAgg._sum.amount ?? 0, count: discountAgg._count._all },
    payments: { amount: paymentAgg._sum.amount ?? 0, count: paymentAgg._count._all },
    refunds: { amount: refundAgg._sum.amount ?? 0, count: refundAgg._count._all },
    scholarships: { amount: scholarshipAgg._sum.amount ?? 0, count: scholarshipAgg._count._all },
    open: { amount: open._sum.total ?? 0, count: open._count._all },
    partial: { amount: partial._sum.total ?? 0, count: partial._count._all },
    paid: { amount: paid._sum.total ?? 0, count: paid._count._all },
  });
}
