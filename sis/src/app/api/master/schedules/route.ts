import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { scheduleCreateSchema } from "@/lib/schemas/master";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize } = parse.data;
  const classroomId = req.nextUrl.searchParams.get("classroomId") || undefined;
  const teacherId = req.nextUrl.searchParams.get("teacherId") || undefined;
  const subjectId = req.nextUrl.searchParams.get("subjectId") || undefined;

  const where: Record<string, unknown> = {};
  if (classroomId) where.classroomId = classroomId;
  if (teacherId) where.teacherId = teacherId;
  if (subjectId) where.subjectId = subjectId;

  const [items, total] = await Promise.all([
    prisma.schedule.findMany({
      where,
      include: { classroom: true, subject: true, teacher: { include: { user: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.schedule.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = scheduleCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const created = await prisma.schedule.create({ data: parsed.data, include: { classroom: true, subject: true, teacher: { include: { user: true } } } });
  return NextResponse.json(created, { status: 201 });
}

