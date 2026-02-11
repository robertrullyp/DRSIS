import { z } from "zod";

export const cmsMenuItemTypeSchema = z.enum(["INTERNAL", "EXTERNAL", "PAGE", "CATEGORY", "TAG"]);

const cmsMenuItemLeafSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  type: cmsMenuItemTypeSchema,
  href: z.string().optional(),
  pageId: z.string().optional(),
  order: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const cmsMenuItemNodeSchema = cmsMenuItemLeafSchema.extend({
  children: z.array(cmsMenuItemLeafSchema).max(50).optional(),
});

export const cmsMenuReplaceSchema = z.object({
  items: z.array(cmsMenuItemNodeSchema).max(200),
});

export type CmsMenuReplaceInput = z.infer<typeof cmsMenuReplaceSchema>;
