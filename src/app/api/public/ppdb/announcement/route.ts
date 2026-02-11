import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const gradeId = req.nextUrl.searchParams.get("gradeId") || undefined;
  const where: any = { OR: [{ status: "ACCEPTED" }, { status: "ENROLLED" }] };
  if (gradeId) where.gradeAppliedId = gradeId;
  const items = await prisma.admissionApplication.findMany({
    where,
    select: { id: true, fullName: true, status: true, gradeApplied: { select: { id: true, name: true } } },
    orderBy: [{ gradeApplied: { name: "asc" } }, { fullName: "asc" }],
  });
  return NextResponse.json({ items });
}

