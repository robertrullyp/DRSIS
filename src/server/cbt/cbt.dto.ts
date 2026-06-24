import { z } from "zod";
import { paginationSchema } from "@/lib/validation";

export const cbtExamCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subjectId: z.string().trim().min(1).optional().nullable(),
  classroomId: z.string().trim().min(1).optional().nullable(),
  startAt: z.coerce.date().optional().nullable(),
  endAt: z.coerce.date().optional().nullable(),
});

export type CbtExamCreateInput = z.infer<typeof cbtExamCreateSchema>;

export const cbtExamListQuerySchema = paginationSchema.extend({
  classroomId: z.string().trim().min(1).optional(),
  subjectId: z.string().trim().min(1).optional(),
  activeOnly: z.coerce.boolean().optional(),
});

export type CbtExamListQueryInput = z.infer<typeof cbtExamListQuerySchema>;

export const cbtQuestionCreateSchema = z.object({
  text: z.string().trim().min(1).max(8000),
  options: z.array(z.string().trim().min(1).max(1000)).min(2).max(10).optional(),
  answer: z.string().trim().min(1).max(2000).optional().nullable(),
});

export type CbtQuestionCreateInput = z.infer<typeof cbtQuestionCreateSchema>;

export const cbtAttemptSubmitSchema = z.object({
  answers: z.record(z.string(), z.string().trim().max(4000)).optional(),
});

export type CbtAttemptSubmitInput = z.infer<typeof cbtAttemptSubmitSchema>;
