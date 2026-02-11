import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, activeYear] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { student: true } }),
    prisma.academicYear.findFirst({ where: { isActive: true }, orderBy: { startDate: "desc" } }),
  ]);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let activeEnrollment: any = null;
  if (user.student) {
    activeEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.student.id,
        active: true,
        ...(activeYear ? { academicYearId: activeYear.id } : {}),
      },
      include: { classroom: { include: { grade: true, academicYear: true } }, academicYear: true },
      orderBy: { enrolledAt: "desc" },
    });
    // fallback: latest active if not matched with activeYear
    if (!activeEnrollment) {
      activeEnrollment = await prisma.enrollment.findFirst({
        where: { studentId: user.student.id, active: true },
        include: { classroom: { include: { grade: true, academicYear: true } }, academicYear: true },
        orderBy: { enrolledAt: "desc" },
      });
    }
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    roles: (token as any)?.roles ?? [],
    student: user.student ? { id: user.student.id, nis: user.student.nis ?? undefined } : null,
    activeYear,
    activeEnrollment,
  });
}

