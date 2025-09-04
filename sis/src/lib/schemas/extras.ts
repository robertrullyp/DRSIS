import { z } from "zod";
import { studentAttendanceStatus } from "@/lib/schemas/attendance";

export const extraCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  coachTeacherId: z.string().optional(),
});
export const extraUpdateSchema = extraCreateSchema.partial();

export const extraMemberCreateSchema = z.object({
  studentId: z.string().min(1),
});

export const extraAttendanceItemSchema = z.object({
  studentId: z.string().min(1),
  date: z.coerce.date(),
  status: studentAttendanceStatus,
});
export const extraAttendanceBulkSchema = z.object({
  items: z.array(extraAttendanceItemSchema).min(1),
});

export const extraEventCreateSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  location: z.string().optional(),
  result: z.string().optional(),
});
export const extraEventUpdateSchema = extraEventCreateSchema.partial();

