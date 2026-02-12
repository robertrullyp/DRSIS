import { z } from "zod";

export const feeRuleCreateSchema = z.object({
  name: z.string().min(1),
  gradeId: z.string().optional(),
  amount: z.coerce.number().int().min(0),
  recurring: z.boolean().default(false),
  description: z.string().optional(),
});
export const feeRuleUpdateSchema = feeRuleCreateSchema.partial();

export const invoiceItemSchema = z.object({ name: z.string().min(1), amount: z.coerce.number().int().min(0) });
export const invoiceCreateSchema = z.object({
  studentId: z.string().min(1),
  academicYearId: z.string().min(1),
  dueDate: z.coerce.date().optional(),
  items: z.array(invoiceItemSchema).min(1),
});

export const paymentCreateSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  method: z.enum(["CASH", "TRANSFER", "GATEWAY", "SCHOLARSHIP", "ADJUSTMENT"]),
  reference: z.string().optional(),
});

export const discountCreateSchema = z.object({
  invoiceId: z.string().min(1),
  name: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  reason: z.string().max(500).optional(),
});
export const discountUpdateSchema = discountCreateSchema
  .omit({ invoiceId: true })
  .partial();

const scholarshipBaseSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

export const scholarshipCreateSchema = scholarshipBaseSchema.refine(
  (data) => !data.endDate || data.endDate >= data.startDate,
  "endDate must be greater than or equal to startDate"
);

export const scholarshipUpdateSchema = scholarshipBaseSchema
  .partial()
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      data.endDate >= data.startDate,
    "endDate must be greater than or equal to startDate"
  );

export const refundCreateSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  reason: z.string().max(500).optional(),
});

export const financeAccountCreateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
  category: z.string().max(100).optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const financeAccountUpdateSchema = financeAccountCreateSchema
  .omit({ code: true })
  .partial();

export const cashBankAccountCreateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  type: z.enum(["CASH", "BANK"]),
  bankName: z.string().max(200).optional(),
  accountNumber: z.string().max(100).optional(),
  ownerName: z.string().max(200).optional(),
  openingBalance: z.coerce.number().int().default(0),
  isActive: z.boolean().optional(),
});

export const cashBankAccountUpdateSchema = cashBankAccountCreateSchema
  .omit({ code: true, openingBalance: true })
  .partial();

export const operationalTxnCreateSchema = z.object({
  txnDate: z.coerce.date().optional(),
  kind: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().int().positive(),
  description: z.string().max(1000).optional(),
  referenceNo: z.string().max(100).optional(),
  proofUrl: z.string().url().max(2000).optional(),
  accountId: z.string().min(1),
  cashBankAccountId: z.string().min(1),
});

export const operationalTransferSchema = z
  .object({
    txnDate: z.coerce.date().optional(),
    amount: z.coerce.number().int().positive(),
    description: z.string().max(1000).optional(),
    referenceNo: z.string().max(100).optional(),
    proofUrl: z.string().url().max(2000).optional(),
    fromCashBankAccountId: z.string().min(1),
    toCashBankAccountId: z.string().min(1),
    fromAccountId: z.string().min(1),
    toAccountId: z.string().min(1),
  })
  .refine(
    (data) => data.fromCashBankAccountId !== data.toCashBankAccountId,
    "fromCashBankAccountId and toCashBankAccountId must be different"
  );

export const operationalTxnRejectSchema = z.object({
  reason: z.string().min(3).max(1000),
});

export const financePeriodLockCreateSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.endDate >= data.startDate,
    "endDate must be greater than or equal to startDate"
  );

const financeBudgetBaseSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  kind: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().int().positive(),
  accountId: z.string().min(1),
  cashBankAccountId: z.string().optional().nullable(),
  notes: z.string().max(1000).optional(),
});

const financeBudgetDateRefinement = (
  data: { periodStart?: Date; periodEnd?: Date | null },
): boolean => {
  if (!data.periodStart || !data.periodEnd) return true;
  return data.periodEnd >= data.periodStart;
};

export const financeBudgetCreateSchema = financeBudgetBaseSchema.refine(
  financeBudgetDateRefinement,
  "periodEnd must be greater than or equal to periodStart",
);

export const financeBudgetUpdateSchema = financeBudgetBaseSchema
  .partial()
  .refine(
    financeBudgetDateRefinement,
    "periodEnd must be greater than or equal to periodStart",
  );
