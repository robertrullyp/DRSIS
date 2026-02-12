import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { scholarshipCreateSchema } from "@/lib/schemas/finance";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  }

  const { page, pageSize } = parse.data;
  const studentId = req.nextUrl.searchParams.get("studentId") || undefined;
  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;

  const [items, total] = await Promise.all([
    prisma.scholarship.findMany({
      where,
      include: { student: { include: { user: true } } },
      orderBy: [{ startDate: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.scholarship.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = scholarshipCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const created = await prisma.scholarship.create({
    data: {
      ...parsed.data,
      endDate: parsed.data.endDate ?? null,
    },
    include: { student: { include: { user: true } } },
  });
  return NextResponse.json(created, { status: 201 });
}
