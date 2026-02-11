import { z } from "zod";

export const assessmentCreateSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  classroomId: z.string().min(1),
  academicYearId: z.string().min(1),
  type: z.string().min(1),
  weight: z.coerce.number().positive().default(1),
  score: z.coerce.number(),
  recordedAt: z.coerce.date().optional(),
});

export const assessmentUpdateSchema = assessmentCreateSchema.partial();

export const assessmentQuerySchema = z.object({
  classroomId: z.string().optional(),
  subjectId: z.string().optional(),
  studentId: z.string().optional(),
  academicYearId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(50),
});

export const reportCardGenerateSchema = z.object({
  classroomId: z.string().min(1),
  semesterId: z.string().min(1),
  remarks: z.string().optional(),
});

export const reportCardQuerySchema = z.object({
  classroomId: z.string().optional(),
  studentId: z.string().optional(),
  semesterId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(50),
});

