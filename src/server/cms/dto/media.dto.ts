import { z } from "zod";

export const cmsMediaModuleSchema = z.enum(["posts", "galleries", "pages", "events"]);

const cmsMediaKeyPattern = /^cms\/(posts|galleries|pages|events)\/[a-z0-9/_\-.]+$/i;

export const cmsMediaListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(24),
  q: z.string().optional(),
  module: cmsMediaModuleSchema.optional(),
});

export const cmsMediaPresignSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255).optional(),
  module: cmsMediaModuleSchema,
});

export const cmsMediaCreateSchema = z.object({
  key: z.string().regex(cmsMediaKeyPattern),
  filename: z.string().min(1).max(255),
  mime: z.string().min(1).max(255),
  size: z.number().int().min(0),
  width: z.number().int().min(1).max(10000).optional(),
  height: z.number().int().min(1).max(10000).optional(),
  module: cmsMediaModuleSchema,
  alt: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
  blurhash: z.string().max(255).optional(),
  thumbUrl: z.string().url().max(1000).optional(),
});

export const cmsMediaUpdateSchema = z.object({
  alt: z.string().max(255).nullable().optional(),
  title: z.string().max(255).nullable().optional(),
  blurhash: z.string().max(255).nullable().optional(),
  thumbUrl: z.string().url().max(1000).nullable().optional(),
});

export type CmsMediaListQueryInput = z.infer<typeof cmsMediaListQuerySchema>;
export type CmsMediaPresignInput = z.infer<typeof cmsMediaPresignSchema>;
export type CmsMediaCreateInput = z.infer<typeof cmsMediaCreateSchema>;
export type CmsMediaUpdateInput = z.infer<typeof cmsMediaUpdateSchema>;
