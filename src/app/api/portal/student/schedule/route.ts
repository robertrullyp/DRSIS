import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { resolvePortalStudentContext } from "@/server/portal/student-context";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classroomId } = await resolvePortalStudentContext(userId);
  if (!classroomId) return NextResponse.json({ items: [] });

  const items = await prisma.schedule.findMany({
    where: { classroomId },
    include: {
      subject: true,
      teacher: { include: { user: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    take: 200,
  });

  return NextResponse.json({ items });
}
