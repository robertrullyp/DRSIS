import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { listAccessiblePortalStudents, resolvePortalStudentContext } from "@/server/portal/student-context";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, activeYear, children] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { student: true } }),
    prisma.academicYear.findFirst({ where: { isActive: true }, orderBy: { startDate: "desc" } }),
    listAccessiblePortalStudents(userId),
  ]);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const requestedStudentId = req.nextUrl.searchParams.get("childId");
  const selectedCtx = await resolvePortalStudentContext(userId, requestedStudentId);
  const selectedChild = children.find((c) => c.id === selectedCtx.studentId) ?? null;

  let activeEnrollment: any = null;
  if (selectedCtx.studentId) {
    activeEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: selectedCtx.studentId,
        active: true,
        ...(selectedCtx.academicYearId ? { academicYearId: selectedCtx.academicYearId } : {}),
      },
      include: { classroom: { include: { grade: true, academicYear: true } }, academicYear: true },
      orderBy: { enrolledAt: "desc" },
    });
    if (!activeEnrollment) {
      activeEnrollment = await prisma.enrollment.findFirst({
        where: { studentId: selectedCtx.studentId, active: true },
        include: { classroom: { include: { grade: true, academicYear: true } }, academicYear: true },
        orderBy: { enrolledAt: "desc" },
      });
    }
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    roles: (token as any)?.roles ?? [],
    student: selectedChild ? { id: selectedChild.id, nis: selectedChild.nis ?? undefined, name: selectedChild.name } : null,
    children: children.map((c) => ({
      id: c.id,
      nis: c.nis ?? undefined,
      name: c.name,
      relation: c.relation,
      classroom: c.classroomName ? { name: c.classroomName } : null,
      academicYear: c.academicYearName ? { name: c.academicYearName } : null,
    })),
    selectedChildId: selectedChild?.id ?? null,
    activeYear,
    activeEnrollment,
  });
}
