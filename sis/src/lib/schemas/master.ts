import { z } from "zod";

export const gradeCreateSchema = z.object({
  name: z.string().min(1),
});

export const academicYearCreateSchema = z.object({
  name: z.string().min(4),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type GradeCreateInput = z.infer<typeof gradeCreateSchema>;
export type AcademicYearCreateInput = z.infer<typeof academicYearCreateSchema>;

export const semesterCreateSchema = z.object({
  name: z.string().min(1),
  number: z.coerce.number().min(1).max(4).optional(),
  academicYearId: z.string().min(1),
});

export const classroomCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  gradeId: z.string().min(1),
  academicYearId: z.string().min(1),
  homeroomTeacherId: z.string().optional(),
});

export const subjectCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  gradeId: z.string().optional(),
  curriculumId: z.string().optional(),
});

export const curriculumCreateSchema = z.object({
  name: z.string().min(1),
  year: z.coerce.number().optional(),
  notes: z.string().optional(),
});

// Update schemas (partial)
export const gradeUpdateSchema = gradeCreateSchema.partial();
export const academicYearUpdateSchema = academicYearCreateSchema.partial();
export const semesterUpdateSchema = semesterCreateSchema.partial();
export const classroomUpdateSchema = classroomCreateSchema.partial();
export const subjectUpdateSchema = subjectCreateSchema.partial();
export const curriculumUpdateSchema = curriculumCreateSchema.partial();
