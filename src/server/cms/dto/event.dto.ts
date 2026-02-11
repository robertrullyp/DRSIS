import { z } from "zod";
import { cmsSlugPattern } from "@/server/cms/dto/page.dto";

export const cmsEventStatusSchema = z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);

export const cmsEventCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(cmsSlugPattern).optional(),
  description: z.string().optional(),
  location: z.string().max(255).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional(),
  coverMediaId: z.string().min(1).optional(),
  status: cmsEventStatusSchema.optional(),
});

export const cmsEventUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().regex(cmsSlugPattern).optional(),
  description: z.string().optional(),
  location: z.string().max(255).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().nullable().optional(),
  coverMediaId: z.string().min(1).nullable().optional(),
  status: cmsEventStatusSchema.optional(),
});

export const cmsEventListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
  status: cmsEventStatusSchema.optional(),
});

export const cmsPublicEventTabSchema = z.enum(["all", "upcoming", "past"]);

export const cmsPublicEventListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(10),
  q: z.string().optional(),
  tab: cmsPublicEventTabSchema.default("all"),
});

export type CmsEventCreateInput = z.infer<typeof cmsEventCreateSchema>;
export type CmsEventUpdateInput = z.infer<typeof cmsEventUpdateSchema>;
export type CmsEventListQueryInput = z.infer<typeof cmsEventListQuerySchema>;
export type CmsPublicEventListQueryInput = z.infer<typeof cmsPublicEventListQuerySchema>;
