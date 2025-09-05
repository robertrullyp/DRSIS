import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leaveQuerySchema, leaveRequestCreateSchema } from "@/lib/schemas/hr";

function daysBetweenInclusive(a: Date, b: Date) {
  const d = Math.floor((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000) + 1;
  return Math.max(1, d);
}

export async function GET(req: NextRequest) {
  const parse = leaveQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, employeeId, status } = parse.data;
  const where: any = {};
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;
  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({ where, include: { employee: { include: { user: true } }, type: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.leaveRequest.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = leaveRequestCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { employeeId, typeId, startDate, endDate, reason } = parsed.data;
  if (!employeeId) return NextResponse.json({ error: "employeeId required" }, { status: 400 });
  const days = daysBetweenInclusive(startDate, endDate);
  const created = await prisma.leaveRequest.create({ data: { employeeId, typeId, startDate, endDate, days, reason: reason ?? null } });
  return NextResponse.json(created, { status: 201 });
}

