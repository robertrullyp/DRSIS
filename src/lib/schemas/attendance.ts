import { z } from "zod";

export const studentAttendanceStatus = z.enum([
  "PRESENT",
  "EXCUSED",
  "SICK",
  "ABSENT",
  "LATE",
]);

export const studentAttendanceItemSchema = z.object({
  studentId: z.string().min(1),
  classroomId: z.string().min(1),
  date: z.coerce.date(),
  status: studentAttendanceStatus,
  notes: z.string().optional(),
});

export const studentAttendanceBulkSchema = z.object({
  items: z.array(studentAttendanceItemSchema).min(1),
});

