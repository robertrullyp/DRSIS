import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, q } = parse.data;
  const where = q ? { OR: [{ user: { name: { contains: q, mode: "insensitive" as const } } }] } : {};
  const [items, total] = await Promise.all([
    prisma.employee.findMany({ where, include: { user: true }, orderBy: { user: { name: "asc" } }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.employee.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

