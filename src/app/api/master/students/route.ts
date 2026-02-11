import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { studentCreateSchema } from "@/lib/schemas/master";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, q } = parse.data;
  const where = q
    ? {
        OR: [
          { user: { name: { contains: q, mode: "insensitive" as const } } },
          { user: { email: { contains: q, mode: "insensitive" as const } } },
          { nis: { contains: q } },
          { nisn: { contains: q } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: true,
        guardians: {
          include: {
            guardianUser: {
              include: {
                role: true,
              },
            },
          },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { user: { name: "asc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = studentCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { name, email, nis, nisn, gender, birthDate, startYear, guardianName } = parsed.data;

  // find student role
  const role = await prisma.role.findUnique({ where: { name: "student" } });
  const created = await prisma.student.create({
    data: {
      nis: nis ?? null,
      nisn: nisn ?? null,
      gender: gender ?? null,
      birthDate: birthDate ?? null,
      startYear: startYear ?? null,
      guardianName: guardianName ?? null,
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
