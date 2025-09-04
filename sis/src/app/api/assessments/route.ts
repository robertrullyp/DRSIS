import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assessmentCreateSchema, assessmentQuerySchema } from "@/lib/schemas/assessment";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const parse = assessmentQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, classroomId, subjectId, studentId, academicYearId } = parse.data;
  const where: Record<string, unknown> = {};
  if (classroomId) (where as any).classroomId = classroomId;
  if (subjectId) (where as any).subjectId = subjectId;
  if (studentId) (where as any).studentId = studentId;
  if (academicYearId) (where as any).academicYearId = academicYearId;
  const [items, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      include: { student: { include: { user: true } }, subject: true, classroom: true, academicYear: true },
      orderBy: { recordedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.assessment.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const perms = (token as any)?.permissions as string[] | undefined;
  const roles = (token as any)?.roles as string[] | undefined;
  const allowed = Boolean(perms?.includes("assessment.manage") || roles?.includes("admin"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = assessmentCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;
  const created = await prisma.assessment.create({ data, include: { student: { include: { user: true } }, subject: true, classroom: true } });
  return NextResponse.json(created, { status: 201 });
}
