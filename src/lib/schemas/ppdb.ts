import { z } from "zod";

export const ppdbApplicationCreateSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  gradeAppliedId: z.string().optional(),
  documents: z.any().optional(),
  score: z.coerce.number().optional(),
});

export const ppdbApplicationUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  gradeAppliedId: z.string().optional(),
  documents: z.any().optional(),
  score: z.coerce.number().optional(),
  status: z.enum(["PENDING", "VERIFIED", "ACCEPTED", "REJECTED", "ENROLLED"]).optional(),
  notes: z.string().optional(),
});

export const ppdbVerifySchema = z.object({
  verified: z.boolean().default(true),
});

export const ppdbDecideSchema = z.object({
  decision: z.enum(["ACCEPTED", "REJECTED"]),
  notes: z.string().optional(),
  autoEnroll: z.boolean().default(true),
});

export const ppdbQuerySchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "ACCEPTED", "REJECTED", "ENROLLED"]).optional(),
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(20),
});

