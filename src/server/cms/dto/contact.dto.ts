import { z } from "zod";

const queryBooleanSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const cmsContactCreateSchema = z
  .object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(255).optional(),
    phone: z.string().max(40).optional(),
    subject: z.string().max(255).optional(),
    message: z.string().min(1).max(5000),
    _company: z.string().max(120).optional(),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Email atau nomor telepon wajib diisi",
    path: ["email"],
  });

export const cmsInboxListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q: z.string().max(255).optional(),
  isRead: queryBooleanSchema.optional(),
  isResolved: queryBooleanSchema.optional(),
});

export const cmsInboxExportQuerySchema = z.object({
  q: z.string().max(255).optional(),
  isRead: queryBooleanSchema.optional(),
  isResolved: queryBooleanSchema.optional(),
});

export const cmsInboxUpdateSchema = z
  .object({
    isRead: z.boolean().optional(),
    isResolved: z.boolean().optional(),
  })
  .refine((data) => typeof data.isRead === "boolean" || typeof data.isResolved === "boolean", {
    message: "Minimal satu field harus diisi",
  });

export type CmsContactCreateInput = z.infer<typeof cmsContactCreateSchema>;
export type CmsInboxListQueryInput = z.infer<typeof cmsInboxListQuerySchema>;
export type CmsInboxExportQueryInput = z.infer<typeof cmsInboxExportQuerySchema>;
export type CmsInboxUpdateInput = z.infer<typeof cmsInboxUpdateSchema>;
