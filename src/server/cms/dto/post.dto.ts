import { z } from "zod";
import { cmsSlugPattern } from "@/server/cms/dto/page.dto";

export const cmsPostTypeSchema = z.enum(["NEWS", "ARTICLE", "ANNOUNCEMENT"]);
export const cmsPostStatusSchema = z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);

export const cmsPostCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(cmsSlugPattern).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  type: cmsPostTypeSchema.optional(),
  status: cmsPostStatusSchema.optional(),
  coverMediaId: z.string().min(1).optional(),
  categoryIds: z.array(z.string().min(1)).max(20).optional(),
  tagIds: z.array(z.string().min(1)).max(20).optional(),
});

export const cmsPostUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().regex(cmsSlugPattern).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  type: cmsPostTypeSchema.optional(),
  status: cmsPostStatusSchema.optional(),
  coverMediaId: z.string().min(1).nullable().optional(),
  categoryIds: z.array(z.string().min(1)).max(20).optional(),
  tagIds: z.array(z.string().min(1)).max(20).optional(),
});

export const cmsPostListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
  status: cmsPostStatusSchema.optional(),
  type: cmsPostTypeSchema.optional(),
});

export const cmsPublicPostListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(10),
  q: z.string().optional(),
  type: cmsPostTypeSchema.optional(),
  category: z.string().regex(cmsSlugPattern).optional(),
  tag: z.string().regex(cmsSlugPattern).optional(),
});

export type CmsPostCreateInput = z.infer<typeof cmsPostCreateSchema>;
export type CmsPostUpdateInput = z.infer<typeof cmsPostUpdateSchema>;
export type CmsPostListQueryInput = z.infer<typeof cmsPostListQuerySchema>;
export type CmsPublicPostListQueryInput = z.infer<typeof cmsPublicPostListQuerySchema>;
