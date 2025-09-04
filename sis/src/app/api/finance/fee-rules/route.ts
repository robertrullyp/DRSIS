import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { feeRuleCreateSchema } from "@/lib/schemas/finance";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, q } = parse.data;
  const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }] } : {};
  const [items, total] = await Promise.all([
    prisma.feeRule.findMany({ where, include: { grade: true }, orderBy: { name: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.feeRule.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = feeRuleCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const created = await prisma.feeRule.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}

