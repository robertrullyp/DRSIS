import type { PaymentMethod, Prisma } from "@/generated/prisma";
import {
  applyCashBankBalance,
  validateFinanceAccount,
} from "@/server/finance/operational";
import { assertFinancePeriodUnlocked } from "@/server/finance/controls";

type InvoicePostingTarget = {
  incomeAccountCode: string;
  incomeAccountName: string;
  cashBankCode: string;
  cashBankName: string;
  cashBankType: "CASH" | "BANK";
};

type PaymentPostingInput = {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: Date;
  createdById: string | null;
};

type InvoicePostingContext = {
  id: string;
  code: string;
};

type RefundPostingInput = {
  id: string;
  amount: number;
  processedBy: string | null;
};

function getPaymentPostingTarget(method: PaymentMethod): InvoicePostingTarget | null {
  const incomeAccountCode =
    process.env.FINANCE_INVOICE_INCOME_ACCOUNT_CODE || "4100";
  const incomeAccountName =
    process.env.FINANCE_INVOICE_INCOME_ACCOUNT_NAME ||
    "Pendapatan Pembayaran Tagihan";
  const cashBankCashCode =
    process.env.FINANCE_INVOICE_CASH_ACCOUNT_CODE || "CASH-OPS";
  const cashBankCashName =
    process.env.FINANCE_INVOICE_CASH_ACCOUNT_NAME || "Kas Operasional";
  const cashBankBankCode =
    process.env.FINANCE_INVOICE_BANK_ACCOUNT_CODE || "BANK-OPS";
  const cashBankBankName =
    process.env.FINANCE_INVOICE_BANK_ACCOUNT_NAME || "Bank Operasional";

  if (method === "CASH") {
    return {
      incomeAccountCode,
      incomeAccountName,
      cashBankCode: cashBankCashCode,
      cashBankName: cashBankCashName,
      cashBankType: "CASH",
    };
  }
  if (method === "TRANSFER" || method === "GATEWAY") {
    return {
      incomeAccountCode,
      incomeAccountName,
      cashBankCode: cashBankBankCode,
      cashBankName: cashBankBankName,
      cashBankType: "BANK",
    };
  }
  return null;
}

async function ensureFinanceAccount(
  tx: Prisma.TransactionClient,
  code: string,
  name: string,
  type: "INCOME" | "EXPENSE"
) {
  return tx.financeAccount.upsert({
    where: { code },
    update: {
      isActive: true,
      name,
      type,
    },
    create: {
      code,
      name,
      type,
      isActive: true,
      category: type === "INCOME" ? "Revenue" : "Expense",
    },
  });
}

async function ensureCashBankAccount(
  tx: Prisma.TransactionClient,
  code: string,
  name: string,
  type: "CASH" | "BANK"
) {
  return tx.cashBankAccount.upsert({
    where: { code },
    update: {
      isActive: true,
      name,
      type,
    },
    create: {
      code,
      name,
      type,
      openingBalance: 0,
      balance: 0,
      isActive: true,
    },
  });
}

export async function postInvoicePaymentToOperationalLedger(
  tx: Prisma.TransactionClient,
  payment: PaymentPostingInput,
  invoice: InvoicePostingContext
) {
  const target = getPaymentPostingTarget(payment.method);
  if (!target) return null;

  const marker = `INVPAY:${payment.id}`;
  const existing = await tx.operationalTxn.findFirst({
    where: { referenceNo: marker },
    select: { id: true },
  });
  if (existing) {
    return tx.operationalTxn.findUnique({ where: { id: existing.id } });
  }

  const [incomeAccount, cashBankAccount] = await Promise.all([
    ensureFinanceAccount(
      tx,
      target.incomeAccountCode,
      target.incomeAccountName,
      "INCOME"
    ),
    ensureCashBankAccount(
      tx,
      target.cashBankCode,
      target.cashBankName,
      target.cashBankType
    ),
  ]);

  await validateFinanceAccount(tx, incomeAccount.id);
  await assertFinancePeriodUnlocked(tx, payment.paidAt);
  await applyCashBankBalance(tx, {
    kind: "INCOME",
    amount: payment.amount,
    cashBankAccountId: cashBankAccount.id,
  });

  return tx.operationalTxn.create({
    data: {
      txnDate: payment.paidAt,
      kind: "INCOME",
      amount: payment.amount,
      description: `Pembayaran tagihan ${invoice.code} (${payment.method})`,
      referenceNo: marker,
      accountId: incomeAccount.id,
      cashBankAccountId: cashBankAccount.id,
      approvalStatus: "APPROVED",
      createdBy: payment.createdById,
      checkedBy: payment.createdById,
      checkedAt: payment.paidAt,
      approvedBy: payment.createdById,
      approvedAt: payment.paidAt,
    },
  });
}

export async function postInvoiceRefundToOperationalLedger(
  tx: Prisma.TransactionClient,
  payment: PaymentPostingInput,
  refund: RefundPostingInput,
  invoice: InvoicePostingContext
) {
  const target = getPaymentPostingTarget(payment.method);
  if (!target) return null;

  const marker = `INVREF:${refund.id}`;
  const existing = await tx.operationalTxn.findFirst({
    where: { referenceNo: marker },
    select: { id: true },
  });
  if (existing) {
    return tx.operationalTxn.findUnique({ where: { id: existing.id } });
  }

  const expenseAccountCode =
    process.env.FINANCE_INVOICE_REFUND_ACCOUNT_CODE || "5100";
  const expenseAccountName =
    process.env.FINANCE_INVOICE_REFUND_ACCOUNT_NAME || "Biaya Refund Pembayaran";

  const [expenseAccount, cashBankAccount] = await Promise.all([
    ensureFinanceAccount(
      tx,
      expenseAccountCode,
      expenseAccountName,
      "EXPENSE"
    ),
    ensureCashBankAccount(
      tx,
      target.cashBankCode,
      target.cashBankName,
      target.cashBankType
    ),
  ]);

  await validateFinanceAccount(tx, expenseAccount.id);
  await assertFinancePeriodUnlocked(tx, new Date());
  await applyCashBankBalance(tx, {
    kind: "EXPENSE",
    amount: refund.amount,
    cashBankAccountId: cashBankAccount.id,
  });

  return tx.operationalTxn.create({
    data: {
      txnDate: new Date(),
      kind: "EXPENSE",
      amount: refund.amount,
      description: `Refund pembayaran tagihan ${invoice.code} (${payment.method})`,
      referenceNo: marker,
      accountId: expenseAccount.id,
      cashBankAccountId: cashBankAccount.id,
      approvalStatus: "APPROVED",
      createdBy: refund.processedBy,
      checkedBy: refund.processedBy,
      checkedAt: new Date(),
      approvedBy: refund.processedBy,
      approvedAt: new Date(),
    },
  });
}
