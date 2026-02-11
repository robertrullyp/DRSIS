import { z } from "zod";

export const assetCategoryCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
export const assetCategoryUpdateSchema = assetCategoryCreateSchema.partial();

export const assetCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().optional(),
  location: z.string().optional(),
  acquisitionDate: z.coerce.date().optional(),
  value: z.coerce.number().optional(),
  depreciationRate: z.coerce.number().optional(),
  notes: z.string().optional(),
});
export const assetUpdateSchema = assetCreateSchema.partial();

export const assetLoanCreateSchema = z.object({
  assetId: z.string().min(1),
  borrowerUserId: z.string().min(1),
  dueAt: z.coerce.date().optional(),
});

export const assetMaintenanceCreateSchema = z.object({
  assetId: z.string().min(1),
  type: z.string().min(1),
  date: z.coerce.date().optional(),
  cost: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

