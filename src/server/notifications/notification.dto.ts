import { z } from "zod";
import { paginationSchema } from "@/lib/validation";

export const notificationSeveritySchema = z.enum(["INFO", "WARNING", "DANGER"]);
export const notificationStatusSchema = z.enum(["UNREAD", "READ", "ARCHIVED"]);

export const notificationCreateSchema = z.object({
  recipientUserId: z.string().trim().min(1),
  studentId: z.string().trim().min(1).optional().nullable(),
  type: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().max(4000).optional().nullable(),
  href: z.string().trim().max(300).optional().nullable(),
  severity: notificationSeveritySchema.default("INFO"),
});

export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;

export const notificationAdminListQuerySchema = paginationSchema.extend({
  status: notificationStatusSchema.optional(),
  severity: notificationSeveritySchema.optional(),
  recipientUserId: z.string().trim().min(1).optional(),
  studentId: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
});

export type NotificationAdminListQueryInput = z.infer<typeof notificationAdminListQuerySchema>;

export const portalNotificationQuerySchema = z.object({
  childId: z.string().trim().min(1).optional(),
  includeArchived: z.coerce.boolean().optional(),
});

export type PortalNotificationQueryInput = z.infer<typeof portalNotificationQuerySchema>;

export const portalNotificationUpdateSchema = z.object({
  status: notificationStatusSchema.extract(["READ", "ARCHIVED"]).default("READ"),
});

export type PortalNotificationUpdateInput = z.infer<typeof portalNotificationUpdateSchema>;
