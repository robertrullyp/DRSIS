import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { teacherCreateSchema } from "@/lib/schemas/master";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, q } = parse.data;
  const where = q
    ? {
        OR: [
          { user: { name: { contains: q, mode: "insensitive" as const } } },
          { user: { email: { contains: q, mode: "insensitive" as const } } },
          { nidn: { contains: q } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      include: { user: true },
      orderBy: { user: { name: "asc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.teacher.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = teacherCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { name, email, nidn, hireDate } = parsed.data;

  // find teacher role
  const role = await prisma.role.findUnique({ where: { name: "teacher" } });
  const created = await prisma.teacher.create({
    data: {
      nidn: nidn ?? null,
      hireDate: hireDate ?? null,
      user: {
        create: {
          email,
          name,
          roleId: role?.id ?? null,
        },
      },
    },
    include: { user: true },
  });
  return NextResponse.json(created, { status: 201 });
}

