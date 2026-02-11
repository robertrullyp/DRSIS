import { z } from "zod";

export const cmsSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const cmsPageStatusSchema = z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);

export const cmsPageCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(cmsSlugPattern).optional(),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  status: cmsPageStatusSchema.optional(),
});

export const cmsPageUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().regex(cmsSlugPattern).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional(),
  status: cmsPageStatusSchema.optional(),
});

export const cmsPageListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
  status: cmsPageStatusSchema.optional(),
});

export type CmsPageCreateInput = z.infer<typeof cmsPageCreateSchema>;
export type CmsPageUpdateInput = z.infer<typeof cmsPageUpdateSchema>;
export type CmsPageListQueryInput = z.infer<typeof cmsPageListQuerySchema>;
