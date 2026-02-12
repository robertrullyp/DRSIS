import { z } from "zod";
import { paginationSchema } from "@/lib/validation";

export const dapodikSyncEnqueueSchema = z.object({
  kind: z.string().trim().min(1).max(80),
});

export type DapodikSyncEnqueueInput = z.infer<typeof dapodikSyncEnqueueSchema>;

export const dapodikBatchListQuerySchema = paginationSchema.extend({
  status: z.enum(["PENDING", "RUNNING", "SUCCESS", "FAILED"]).optional(),
  kind: z.string().trim().min(1).optional(),
});

export type DapodikBatchListQueryInput = z.infer<typeof dapodikBatchListQuerySchema>;

export const dapodikStagingListQuerySchema = paginationSchema.extend({
  status: z.enum(["NEW", "MATCHED", "CONFLICT", "REJECTED"]).optional(),
  entityType: z.string().trim().min(1).optional(),
  batchId: z.string().trim().min(1).optional(),
});

export type DapodikStagingListQueryInput = z.infer<typeof dapodikStagingListQuerySchema>;

export const dapodikStagingUpdateSchema = z.object({
  status: z.enum(["NEW", "MATCHED", "CONFLICT", "REJECTED"]).optional(),
  matchedLocalType: z.string().trim().min(1).max(60).optional().nullable(),
  matchedLocalId: z.string().trim().min(1).max(80).optional().nullable(),
  notes: z.string().trim().min(1).max(2000).optional().nullable(),
});

export type DapodikStagingUpdateInput = z.infer<typeof dapodikStagingUpdateSchema>;
