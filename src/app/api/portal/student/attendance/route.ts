import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { resolvePortalStudentContext } from "@/server/portal/student-context";

function parseDateRange(dateParam: string | null) {
  const base = dateParam ? new Date(`${dateParam}T00:00:00.000Z`) : new Date();
  if (Number.isNaN(base.getTime())) return null;

  const start = new Date(base);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const range = parseDateRange(req.nextUrl.searchParams.get("date"));
  if (!range) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const { studentId } = await resolvePortalStudentContext(userId);
  if (!studentId) return NextResponse.json({ item: null });

  const item = await prisma.studentAttendance.findFirst({
    where: {
      studentId,
      date: { gte: range.start, lte: range.end },
    },
    include: { student: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!item) return NextResponse.json({ item: null });

  return NextResponse.json({
    item: {
      id: item.id,
      studentId: item.studentId,
      studentName: item.student.user?.name ?? "",
      status: item.status,
      notes: item.notes,
      date: item.date,
    },
  });
}
