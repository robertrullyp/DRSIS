import { z } from "zod";

export const libItemCreateSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  author: z.string().optional(),
  publisher: z.string().optional(),
  year: z.coerce.number().optional(),
  copies: z.coerce.number().min(1).default(1),
});
export const libItemUpdateSchema = libItemCreateSchema.partial();

export const libMemberCreateSchema = z.object({
  userId: z.string().optional(),
  studentId: z.string().optional(),
});
export const libMemberUpdateSchema = z.object({});

export const libLoanCreateSchema = z.object({
  itemId: z.string().min(1),
  memberId: z.string().min(1),
});

export const libSettingsUpdateSchema = z.object({
  maxLoans: z.coerce.number().min(1).optional(),
  loanDays: z.coerce.number().min(1).optional(),
  finePerDay: z.coerce.number().min(0).optional(),
});

