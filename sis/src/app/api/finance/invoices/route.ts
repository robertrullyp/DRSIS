import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { invoiceCreateSchema } from "@/lib/schemas/finance";

function computeTotal(items: { amount: number }[]) {
  return items.reduce((a, b) => a + (b.amount || 0), 0);
}

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize } = parse.data;
  const studentId = req.nextUrl.searchParams.get("studentId") || undefined;
  const status = req.nextUrl.searchParams.get("status") || undefined;
  const where: Record<string, unknown> = {};
  if (studentId) (where as any).studentId = studentId;
  if (status) (where as any).status = status;
  const [items, total] = await Promise.all([
    prisma.invoice.findMany({ where, include: { student: { include: { user: true } }, items: true, payments: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.invoice.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = invoiceCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { studentId, academicYearId, dueDate, items } = parsed.data;
  const total = computeTotal(items);
  const code = `INV-${Date.now()}`;
  const created = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({ data: { code, studentId, academicYearId, dueDate: dueDate ?? null, status: "OPEN", total } });
    await tx.invoiceItem.createMany({ data: items.map((it) => ({ invoiceId: inv.id, name: it.name, amount: it.amount })) });
    return tx.invoice.findUnique({ where: { id: inv.id }, include: { items: true, payments: true, student: { include: { user: true } } } });
  });
  return NextResponse.json(created, { status: 201 });
}

