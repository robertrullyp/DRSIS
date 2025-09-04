import { z } from "zod";

export const savingsAccountCreateSchema = z.object({
  studentId: z.string().min(1),
});

export const savingsTxnCreateSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(["DEPOSIT", "WITHDRAWAL", "ADJUSTMENT"]),
  amount: z.coerce.number().int().positive(),
  requestedBy: z.string().optional(),
});
