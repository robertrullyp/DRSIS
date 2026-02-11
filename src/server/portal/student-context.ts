import { prisma } from "@/lib/prisma";

export type PortalStudentContext = {
  studentId: string | null;
  classroomId: string | null;
  academicYearId: string | null;
  availableStudentIds: string[];
};

export type AccessiblePortalStudent = {
  id: string;
  name: string;
  nis: string | null;
  relation: "SELF" | "GUARDIAN";
  classroomId: string | null;
  classroomName: string | null;
  academicYearId: string | null;
  academicYearName: string | null;
};

async function resolveActiveEnrollment(studentId: string, activeYearId: string | null) {
  let activeEnrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      active: true,
      ...(activeYearId ? { academicYearId: activeYearId } : {}),
    },
    include: { classroom: { include: { academicYear: true } }, academicYear: true },
    orderBy: { enrolledAt: "desc" },
  });

  if (!activeEnrollment) {
    activeEnrollment = await prisma.enrollment.findFirst({
      where: { studentId, active: true },
      include: { classroom: { include: { academicYear: true } }, academicYear: true },
      orderBy: { enrolledAt: "desc" },
    });
  }

  return activeEnrollment;
}

export async function listAccessiblePortalStudents(userId: string): Promise<AccessiblePortalStudent[]> {
  const [user, activeYear, guardianLinks] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { student: { include: { user: true } } } }),
    prisma.academicYear.findFirst({ where: { isActive: true }, orderBy: { startDate: "desc" } }),
    prisma.studentGuardian.findMany({
      where: { guardianUserId: userId },
      include: { student: { include: { user: true } } },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  if (!user) return [];

  const candidates = new Map<string, { student: { id: string; nis: string | null; user: { name: string | null } | null }; relation: "SELF" | "GUARDIAN" }>();
  if (user.student) {
    candidates.set(user.student.id, { student: user.student, relation: "SELF" });
  }
  for (const link of guardianLinks) {
    if (!candidates.has(link.student.id)) {
      candidates.set(link.student.id, { student: link.student, relation: "GUARDIAN" });
    }
  }

  const result: AccessiblePortalStudent[] = [];
  for (const { student, relation } of candidates.values()) {
    const enrollment = await resolveActiveEnrollment(student.id, activeYear?.id ?? null);
    result.push({
      id: student.id,
      name: student.user?.name ?? student.id,
      nis: student.nis ?? null,
      relation,
      classroomId: enrollment?.classroomId ?? null,
      classroomName: enrollment?.classroom?.name ?? null,
      academicYearId: enrollment?.academicYearId ?? activeYear?.id ?? null,
      academicYearName: enrollment?.academicYear?.name ?? activeYear?.name ?? null,
    });
  }

  result.sort((a, b) => {
    if (a.relation === "SELF" && b.relation !== "SELF") return -1;
    if (a.relation !== "SELF" && b.relation === "SELF") return 1;
    return a.name.localeCompare(b.name);
  });
  return result;
}

export async function resolvePortalStudentContext(
  userId: string,
  requestedStudentId?: string | null
): Promise<PortalStudentContext> {
  const children = await listAccessiblePortalStudents(userId);
  if (children.length === 0) {
    return { studentId: null, classroomId: null, academicYearId: null, availableStudentIds: [] };
  }

  const selected =
    (requestedStudentId ? children.find((c) => c.id === requestedStudentId) : null) ??
    children[0];

  if (!selected) {
    return { studentId: null, classroomId: null, academicYearId: null, availableStudentIds: children.map((c) => c.id) };
  }

  return {
    studentId: selected.id,
    classroomId: selected.classroomId,
    academicYearId: selected.academicYearId,
    availableStudentIds: children.map((c) => c.id),
  };
}
