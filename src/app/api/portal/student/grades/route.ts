import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { resolvePortalStudentContext } from "@/server/portal/student-context";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestedStudentId = req.nextUrl.searchParams.get("childId");
  const { studentId, academicYearId } = await resolvePortalStudentContext(userId, requestedStudentId);
  if (!studentId) return NextResponse.json({ items: [] });

  const items = await prisma.assessment.findMany({
    where: {
      studentId,
      ...(academicYearId ? { academicYearId } : {}),
    },
    include: { subject: true },
    orderBy: { recordedAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ items });
}
