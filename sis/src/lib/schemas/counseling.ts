import { z } from "zod";

export const counselingTicketCreateSchema = z.object({
  studentId: z.string().min(1),
  subject: z.string().min(1),
});
export const counselingTicketUpdateSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
});

export const counselingSessionCreateSchema = z.object({
  notes: z.string().optional(),
  endedAt: z.coerce.date().optional(),
});

export const counselingReferralCreateSchema = z.object({
  referredTo: z.string().min(1),
  notes: z.string().optional(),
});

