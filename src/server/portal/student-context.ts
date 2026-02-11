import { prisma } from "@/lib/prisma";

export type PortalStudentContext = {
  studentId: string | null;
  classroomId: string | null;
  academicYearId: string | null;
};

export async function resolvePortalStudentContext(userId: string): Promise<PortalStudentContext> {
  const [user, activeYear] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { student: true } }),
    prisma.academicYear.findFirst({ where: { isActive: true }, orderBy: { startDate: "desc" } }),
  ]);

  if (!user?.student) {
    return { studentId: null, classroomId: null, academicYearId: activeYear?.id ?? null };
  }

  let activeEnrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: user.student.id,
      active: true,
      ...(activeYear ? { academicYearId: activeYear.id } : {}),
    },
    orderBy: { enrolledAt: "desc" },
  });

  if (!activeEnrollment) {
    activeEnrollment = await prisma.enrollment.findFirst({
      where: { studentId: user.student.id, active: true },
      orderBy: { enrolledAt: "desc" },
    });
  }

  return {
    studentId: user.student.id,
    classroomId: activeEnrollment?.classroomId ?? null,
    academicYearId: activeEnrollment?.academicYearId ?? activeYear?.id ?? null,
  };
}
