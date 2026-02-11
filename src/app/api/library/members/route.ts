import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { libMemberCreateSchema } from "@/lib/schemas/library";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, q } = parse.data;
  const where = q
    ? {
        OR: [
          { user: { name: { contains: q, mode: "insensitive" as const } } },
          { student: { user: { name: { contains: q, mode: "insensitive" as const } } } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.libMember.findMany({ where, include: { user: true, student: { include: { user: true } } }, orderBy: { joinedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.libMember.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = libMemberCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { userId, studentId } = parsed.data;
  const created = await prisma.libMember.create({ data: { userId: userId ?? null, studentId: studentId ?? null } });
  return NextResponse.json(created, { status: 201 });
}

