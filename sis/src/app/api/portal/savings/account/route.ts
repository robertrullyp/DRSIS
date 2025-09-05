import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
  if (!user?.student) return NextResponse.json({ account: null });
  const account = await prisma.savingsAccount.findUnique({ where: { studentId: user.student.id } });
  return NextResponse.json({ account });
}

