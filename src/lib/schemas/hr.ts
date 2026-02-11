import { z } from "zod";

export const shiftCreateSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const shiftUpdateSchema = shiftCreateSchema.partial();

export const staffCheckSchema = z.object({
  employeeId: z.string().min(1),
  shiftId: z.string().optional(),
  date: z.coerce.date().optional(),
  action: z.enum(["checkin", "checkout"]),
  method: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  note: z.string().optional(),
});

export const staffAttendanceQuerySchema = z.object({
  date: z.coerce.date().optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  employeeId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(20),
});

export const staffAttendanceUpdateSchema = z.object({
  status: z.string().optional(),
  checkInAt: z.coerce.date().nullable().optional(),
  checkOutAt: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  shiftId: z.string().nullable().optional(),
  approve: z.boolean().optional(),
});

// Leave Types
export const leaveTypeCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  maxDaysPerYear: z.coerce.number().int().min(0).optional(),
  requiresApproval: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  countsAsPresence: z.coerce.boolean().optional(),
});
export const leaveTypeUpdateSchema = leaveTypeCreateSchema.partial();

// Leave Requests
export const leaveRequestCreateSchema = z
  .object({
    employeeId: z.string().optional(), // portal: inferred; admin: required
    typeId: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().optional(),
  })
  .refine((d) => d.endDate >= d.startDate, { message: "endDate must be after startDate", path: ["endDate"] });

export const leaveQuerySchema = z.object({
  employeeId: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(20),
});
