import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { resolvePortalStudentContext } from "@/server/portal/student-context";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requestedStudentId = req.nextUrl.searchParams.get("childId");
  const { studentId } = await resolvePortalStudentContext(userId, requestedStudentId);
  if (!studentId) return NextResponse.json({ items: [] });
  const acc = await prisma.savingsAccount.findUnique({ where: { studentId } });
  if (!acc) return NextResponse.json({ items: [] });
  const startStr = req.nextUrl.searchParams.get("start") || undefined;
  const endStr = req.nextUrl.searchParams.get("end") || undefined;

  const where: any = { accountId: acc.id };
  if (startStr && endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) where.createdAt = { gte: start, lte: end };
  }
  const items = await prisma.savingsTransaction.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items });
}
