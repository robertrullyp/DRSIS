import { z } from "zod";
import { cmsSlugPattern } from "@/server/cms/dto/page.dto";

export const cmsGalleryStatusSchema = z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);

export const cmsGalleryCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(cmsSlugPattern).optional(),
  description: z.string().optional(),
  coverMediaId: z.string().min(1).optional(),
  status: cmsGalleryStatusSchema.optional(),
});

export const cmsGalleryUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().regex(cmsSlugPattern).optional(),
  description: z.string().optional(),
  coverMediaId: z.string().min(1).nullable().optional(),
  status: cmsGalleryStatusSchema.optional(),
});

export const cmsGalleryListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
  status: cmsGalleryStatusSchema.optional(),
});

export const cmsGalleryItemSchema = z.object({
  mediaId: z.string().min(1),
  caption: z.string().max(500).optional(),
  order: z.coerce.number().int().min(0).default(0),
});

export const cmsGallerySetItemsSchema = z.object({
  items: z.array(cmsGalleryItemSchema).max(300),
});

export const cmsPublicGalleryListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12),
  q: z.string().optional(),
});

export type CmsGalleryCreateInput = z.infer<typeof cmsGalleryCreateSchema>;
export type CmsGalleryUpdateInput = z.infer<typeof cmsGalleryUpdateSchema>;
export type CmsGalleryListQueryInput = z.infer<typeof cmsGalleryListQuerySchema>;
export type CmsGalleryItemInput = z.infer<typeof cmsGalleryItemSchema>;
export type CmsGallerySetItemsInput = z.infer<typeof cmsGallerySetItemsSchema>;
export type CmsPublicGalleryListQueryInput = z.infer<typeof cmsPublicGalleryListQuerySchema>;
