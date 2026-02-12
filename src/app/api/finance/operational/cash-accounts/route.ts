import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { cashBankAccountCreateSchema } from "@/lib/schemas/finance";

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
      { bankName: { contains: q, mode: "insensitive" } },
      { accountNumber: { contains: q, mode: "insensitive" } },
    ];
  }
  if (type) where.type = type;
  if (typeof isActive === "boolean") where.isActive = isActive;

  const [items, total] = await Promise.all([
    prisma.cashBankAccount.findMany({
      where,
      orderBy: [{ type: "asc" }, { code: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cashBankAccount.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = cashBankAccountCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  try {
    const created = await prisma.cashBankAccount.create({
      data: {
        code: parsed.data.code.trim(),
        name: parsed.data.name.trim(),
        type: parsed.data.type,
        bankName: parsed.data.bankName?.trim() || null,
        accountNumber: parsed.data.accountNumber?.trim() || null,
        ownerName: parsed.data.ownerName?.trim() || null,
        openingBalance: parsed.data.openingBalance ?? 0,
        balance: parsed.data.openingBalance ?? 0,
        isActive: parsed.data.isActive ?? true,
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
