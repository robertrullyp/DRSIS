import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { assetLoanCreateSchema } from "@/lib/schemas/assets";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize } = parse.data;
  const assetId = req.nextUrl.searchParams.get("assetId") || undefined;
  const borrowerUserId = req.nextUrl.searchParams.get("borrowerUserId") || undefined;
  const active = req.nextUrl.searchParams.get("active") || undefined;
  const where: Record<string, unknown> = {};
  if (assetId) (where as any).assetId = assetId;
  if (borrowerUserId) (where as any).borrowerUserId = borrowerUserId;
  if (typeof active !== "undefined") (where as any).returnedAt = active === "true" ? null : { not: null };
  const [items, total] = await Promise.all([
    prisma.assetLoan.findMany({ where, include: { asset: true, borrower: true }, orderBy: { borrowedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.assetLoan.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = assetLoanCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { assetId, borrowerUserId, dueAt } = parsed.data;
  const loan = await prisma.assetLoan.create({ data: { assetId, borrowerUserId, dueAt: dueAt ?? null } });
  return NextResponse.json(loan, { status: 201 });
}

