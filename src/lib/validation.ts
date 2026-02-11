import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(20),
  q: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

