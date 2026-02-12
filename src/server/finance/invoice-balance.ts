import { InvoiceStatus, Prisma } from "@/generated/prisma";

type InvoiceBalanceInput = {
  total: number;
  discountTotal: number;
  paymentTotal: number;
  refundTotal: number;
};

export type InvoiceBalance = {
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
  paymentTotal: number;
  refundTotal: number;
  paidNet: number;
  due: number;
  overpaid: number;
};

export function computeInvoiceBalance(input: InvoiceBalanceInput): InvoiceBalance {
  const grossTotal = Math.max(0, input.total || 0);
  const discountTotal = Math.max(0, input.discountTotal || 0);
  const paymentTotal = Math.max(0, input.paymentTotal || 0);
  const refundTotal = Math.max(0, input.refundTotal || 0);
  const netTotal = Math.max(0, grossTotal - discountTotal);
  const paidNet = paymentTotal - refundTotal;
  const due = Math.max(0, netTotal - paidNet);
  const overpaid = Math.max(0, paidNet - netTotal);
  return {
    grossTotal,
    discountTotal,
    netTotal,
    paymentTotal,
    refundTotal,
    paidNet,
    due,
    overpaid,
  };
}

export function deriveInvoiceStatus(
  currentStatus: InvoiceStatus,
  balance: InvoiceBalance
): InvoiceStatus {
  if (currentStatus === "VOID") return "VOID";
  if (balance.netTotal <= 0) return "PAID";
  if (balance.paidNet <= 0) return "OPEN";
  if (balance.paidNet >= balance.netTotal) return "PAID";
  return "PARTIAL";
}

export async function recalculateInvoiceStatus(
  tx: Prisma.TransactionClient,
  invoiceId: string
) {
  const invoice = await tx.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    select: { id: true, total: true, status: true },
  });

  const [discountAgg, paymentAgg, refundAgg] = await Promise.all([
    tx.discount.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    }),
    tx.payment.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    }),
    tx.refund.aggregate({
      where: { payment: { invoiceId } },
      _sum: { amount: true },
    }),
  ]);

  const balance = computeInvoiceBalance({
    total: invoice.total,
    discountTotal: discountAgg._sum.amount ?? 0,
    paymentTotal: paymentAgg._sum.amount ?? 0,
    refundTotal: refundAgg._sum.amount ?? 0,
  });
  const status = deriveInvoiceStatus(invoice.status, balance);
  if (status !== invoice.status) {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status },
    });
  }

  return { status, balance };
}

type InvoiceSummaryShape = {
  total: number;
  discounts?: { amount: number }[] | null;
  payments?: ({ amount: number; refunds?: { amount: number }[] | null } & Record<string, unknown>)[] | null;
};

export function summarizeInvoice(invoice: InvoiceSummaryShape) {
  const discountTotal = (invoice.discounts ?? []).reduce(
    (acc, row) => acc + (row.amount || 0),
    0
  );
  const paymentTotal = (invoice.payments ?? []).reduce(
    (acc, row) => acc + (row.amount || 0),
    0
  );
  const refundTotal = (invoice.payments ?? []).reduce(
    (acc, payment) =>
      acc +
      (payment.refunds ?? []).reduce(
        (rAcc, refund) => rAcc + (refund.amount || 0),
        0
      ),
    0
  );
  return computeInvoiceBalance({
    total: invoice.total,
    discountTotal,
    paymentTotal,
    refundTotal,
  });
}
