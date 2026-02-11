import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { enrollmentCreateSchema } from "@/lib/schemas/master";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, q } = parse.data;
  const classroomId = req.nextUrl.searchParams.get("classroomId") || undefined;
  const academicYearId = req.nextUrl.searchParams.get("academicYearId") || undefined;
  const studentId = req.nextUrl.searchParams.get("studentId") || undefined;
  const where: Record<string, unknown> = {};
  if (q) {
    Object.assign(where, {
      OR: [
        { student: { user: { name: { contains: q, mode: "insensitive" as const } } } },
        { classroom: { name: { contains: q, mode: "insensitive" as const } } },
        { academicYear: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    });
  }
  if (classroomId) (where as any).classroomId = classroomId;
  if (academicYearId) (where as any).academicYearId = academicYearId;
  if (studentId) (where as any).studentId = studentId;
  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: { student: { include: { user: true } }, classroom: true, academicYear: true },
      orderBy: { enrolledAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.enrollment.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = enrollmentCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { studentId, classroomId, academicYearId, active } = parsed.data;
  const created = await prisma.enrollment.create({
    data: {
      studentId,
      classroomId,
      academicYearId,
      active: active ?? true,
    },
    include: { student: { include: { user: true } }, classroom: true, academicYear: true },
  });
  return NextResponse.json(created, { status: 201 });
}
