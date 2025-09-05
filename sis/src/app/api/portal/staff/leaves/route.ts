import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { leaveRequestCreateSchema } from "@/lib/schemas/hr";
import { queueWa, queueEmail } from "@/lib/notify";

function daysBetweenInclusive(a: Date, b: Date) {
  const d = Math.floor((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000) + 1;
  return Math.max(1, d);
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ items: [] });
  const me = await prisma.employee.findUnique({ where: { userId }, include: { user: true } });
  if (!me) return NextResponse.json({ items: [] });
  const items = await prisma.leaveRequest.findMany({ where: { employeeId: me.id }, include: { type: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await prisma.employee.findUnique({ where: { userId } });
  if (!me) return NextResponse.json({ error: "Not an employee" }, { status: 403 });
  const body = await req.json();
  const parsed = leaveRequestCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { typeId, startDate, endDate, reason } = parsed.data;
  const days = daysBetweenInclusive(startDate, endDate);

  // Quota check (calendar year)
  const type = await prisma.leaveType.findUnique({ where: { id: typeId } });
  if (type?.maxDaysPerYear) {
    const y = startDate.getFullYear();
    const yearStart = new Date(Date.UTC(y, 0, 1));
    const yearEnd = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
    const existing = await prisma.leaveRequest.findMany({
      where: { employeeId: me.id, typeId, status: "APPROVED", AND: [{ endDate: { gte: yearStart } }, { startDate: { lte: yearEnd } }] },
    });
    const overlap = (a: Date, b: Date) => {
      const s = new Date(Math.max(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()), yearStart.getTime()));
      const e = new Date(Math.min(Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()), yearEnd.getTime()));
      const d = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
      return d > 0 ? d : 0;
    };
    const used = existing.reduce((sum, r) => sum + overlap(r.startDate, r.endDate), 0);
    const reqWithin = overlap(startDate, endDate);
    if (used + reqWithin > type.maxDaysPerYear) {
      return NextResponse.json({ error: `Quota exceeded: used ${used} of ${type.maxDaysPerYear} days` }, { status: 400 });
    }
  }

  const created = await prisma.leaveRequest.create({ data: { employeeId: me.id, typeId, startDate, endDate, days, reason: reason ?? null } });

  // Notify employee (self-confirmation)
  const user = await prisma.user.findUnique({ where: { id: me.userId } });
  const payload = { startDate, endDate, days, typeId } as any;
  await queueWa(user?.phone ?? null, "leave.requested", payload);
  await queueEmail(user?.email ?? null, "leave.requested", payload, "Pengajuan Cuti/Izin Diterima");
  return NextResponse.json(created, { status: 201 });
}
