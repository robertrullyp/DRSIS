import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { staffAttendanceQuerySchema } from "@/lib/schemas/hr";

export async function GET(req: NextRequest) {
  const parse = staffAttendanceQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { date, start, end, employeeId, page, pageSize } = parse.data;
  const where: Record<string, unknown> = {};
  if (employeeId) where.employeeId = employeeId;
  if (date) where.date = date;
  if (start && end) where.date = { gte: start, lte: end };
  const [items, total] = await Promise.all([
    prisma.staffAttendance.findMany({ where, include: { employee: { include: { user: true } }, shift: true }, orderBy: { date: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.staffAttendance.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}
