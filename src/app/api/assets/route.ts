import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { assetCreateSchema } from "@/lib/schemas/assets";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, q } = parse.data;
  const categoryId = req.nextUrl.searchParams.get("categoryId") || undefined;
  const where: Record<string, unknown> = {};
  if (q) Object.assign(where, { OR: [{ code: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }, { location: { contains: q, mode: "insensitive" as const } }] });
  if (categoryId) (where as any).categoryId = categoryId;
  const [items, total] = await Promise.all([
    prisma.asset.findMany({ where, include: { category: true }, orderBy: { name: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.asset.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = assetCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const created = await prisma.asset.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}

