import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { financeAccountCreateSchema } from "@/lib/schemas/finance";

export async function GET(req: NextRequest) {
  const parsed = paginationSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { page, pageSize, q } = parsed.data;
  const type = req.nextUrl.searchParams.get("type") || undefined;
  const isActiveParam = req.nextUrl.searchParams.get("isActive");
  const isActive =
    isActiveParam === null ? undefined : isActiveParam === "true";

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }
  if (type) where.type = type;
  if (typeof isActive === "boolean") where.isActive = isActive;

  const [items, total] = await Promise.all([
    prisma.financeAccount.findMany({
      where,
      include: {
        parent: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ code: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.financeAccount.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = financeAccountCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const payload = parsed.data;

  if (payload.parentId) {
    const parent = await prisma.financeAccount.findUnique({
      where: { id: payload.parentId },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Parent account not found" },
        { status: 400 }
      );
    }
  }

  try {
    const created = await prisma.financeAccount.create({
      data: {
        code: payload.code.trim(),
        name: payload.name.trim(),
        type: payload.type,
        category: payload.category?.trim() || null,
        parentId: payload.parentId ?? null,
        isActive: payload.isActive ?? true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create account" },
      { status: 400 }
    );
  }
}
