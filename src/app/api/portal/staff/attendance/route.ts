import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { staffAttendanceQuerySchema } from "@/lib/schemas/hr";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.employee.findUnique({ where: { userId } });
  if (!me) return NextResponse.json({ error: "Not an employee" }, { status: 403 });

  const parse = staffAttendanceQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });

  const { date, start, end, page, pageSize } = parse.data;
  const where: {
    employeeId: string;
    date?: Date | { gte: Date; lte: Date };
  } = { employeeId: me.id };

  if (date) where.date = date;
  if (start && end) where.date = { gte: start, lte: end };

  const [items, total] = await Promise.all([
    prisma.staffAttendance.findMany({
      where,
      include: { shift: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.staffAttendance.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
