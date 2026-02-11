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

