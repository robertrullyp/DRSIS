import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { resolvePortalStudentContext } from "@/server/portal/student-context";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status") || undefined;
  const requestedStudentId = req.nextUrl.searchParams.get("childId");

  const { studentId } = await resolvePortalStudentContext(userId, requestedStudentId);
  if (!studentId) return NextResponse.json({ items: [] });

  const where: any = { studentId };
  if (status) where.status = status;
  const items = await prisma.invoice.findMany({
    where,
    include: { items: true, payments: true, academicYear: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ items });
}
