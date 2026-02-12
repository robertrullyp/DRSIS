import { z } from "zod";
import { paginationSchema } from "@/lib/validation";

export const lmsLinkCreateSchema = z.object({
  external: z.string().trim().min(1).max(50),
  externalId: z.string().trim().min(1).max(160),
  classroomId: z.string().trim().min(1).optional(),
  subjectId: z.string().trim().min(1).optional(),
});

export const lmsLinkUpdateSchema = z.object({
  external: z.string().trim().min(1).max(50).optional(),
  externalId: z.string().trim().min(1).max(160).optional(),
  classroomId: z.string().trim().min(1).optional().nullable(),
  subjectId: z.string().trim().min(1).optional().nullable(),
});

export const lmsLinkListQuerySchema = paginationSchema.extend({
  external: z.string().trim().min(1).optional(),
  classroomId: z.string().trim().min(1).optional(),
  subjectId: z.string().trim().min(1).optional(),
});

export type LmsLinkCreateInput = z.infer<typeof lmsLinkCreateSchema>;
export type LmsLinkUpdateInput = z.infer<typeof lmsLinkUpdateSchema>;
export type LmsLinkListQueryInput = z.infer<typeof lmsLinkListQuerySchema>;

export const lmsScoreImportRowSchema = z
  .object({
    studentId: z.string().trim().min(1).optional(),
    nisn: z.string().trim().min(1).optional(),
    nis: z.string().trim().min(1).optional(),
    email: z.string().trim().min(1).optional(),
    score: z.coerce.number(),
  })
  .superRefine((row, ctx) => {
    const hasIdentity = Boolean(row.studentId || row.nisn || row.nis || row.email);
    if (!hasIdentity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sertakan salah satu: studentId/nisn/nis/email",
      });
    }
    if (!Number.isFinite(row.score)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Score harus berupa angka",
      });
    }
  });

export const lmsScoreImportSchema = z
  .object({
    mode: z.enum(["replace_all", "upsert"]).default("replace_all"),
    items: z.array(lmsScoreImportRowSchema).optional(),
    csv: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    if ((!input.items || input.items.length === 0) && !input.csv) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sertakan items (JSON) atau csv (string)",
      });
    }
  });

export type LmsScoreImportRowInput = z.infer<typeof lmsScoreImportRowSchema>;
export type LmsScoreImportInput = z.infer<typeof lmsScoreImportSchema>;

export const lmsScoreListQuerySchema = paginationSchema;
export type LmsScoreListQueryInput = z.infer<typeof lmsScoreListQuerySchema>;

