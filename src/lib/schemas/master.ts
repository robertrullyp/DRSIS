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

// --- Additional master schemas (teachers, students, enrollments, schedules)

export const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);

export const teacherCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  nidn: z.string().optional(),
  hireDate: z.coerce.date().optional(),
});
export const teacherUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  nidn: z.string().optional(),
  hireDate: z.coerce.date().optional(),
});

export const studentCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  nis: z.string().optional(),
  nisn: z.string().optional(),
  gender: genderEnum.optional(),
  birthDate: z.coerce.date().optional(),
  startYear: z.coerce.number().optional(),
  guardianName: z.string().optional(),
});
export const studentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  nis: z.string().optional(),
  nisn: z.string().optional(),
  photoUrl: z.string().optional(),
  gender: genderEnum.optional(),
  birthDate: z.coerce.date().optional(),
  startYear: z.coerce.number().optional(),
  guardianName: z.string().optional(),
});

export const enrollmentCreateSchema = z.object({
  studentId: z.string().min(1),
  classroomId: z.string().min(1),
  academicYearId: z.string().min(1),
  active: z.boolean().optional(),
});
export const enrollmentUpdateSchema = enrollmentCreateSchema.partial();

export const scheduleCreateSchema = z.object({
  classroomId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  dayOfWeek: z.coerce.number().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});
export const scheduleUpdateSchema = scheduleCreateSchema.partial();

// School profile
export const schoolProfileSchema = z.object({
  name: z.string().min(1),
  npsn: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  principal: z.string().optional(),
  accreditation: z.string().optional(),
  motto: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
});
export const schoolProfileUpdateSchema = schoolProfileSchema.partial();
