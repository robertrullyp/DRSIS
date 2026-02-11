import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { queueWa, queueEmail } from "@/lib/notify";

function dateOnlyUTC(d: Date) { return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lr = await prisma.leaveRequest.findUnique({ where: { id }, include: { type: true } });
  if (!lr) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Quota check on approval
  if (lr.type?.maxDaysPerYear) {
    const y = lr.startDate.getFullYear();
    const yearStart = new Date(Date.UTC(y, 0, 1));
    const yearEnd = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
    const existing = await prisma.leaveRequest.findMany({ where: { employeeId: lr.employeeId, typeId: lr.typeId, status: "APPROVED", AND: [{ endDate: { gte: yearStart } }, { startDate: { lte: yearEnd } }] } });
    const overlap = (a: Date, b: Date) => {
      const s = new Date(Math.max(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()), yearStart.getTime()));
      const e = new Date(Math.min(Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()), yearEnd.getTime()));
      const d = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
      return d > 0 ? d : 0;
    };
    const used = existing.reduce((sum, r) => sum + overlap(r.startDate, r.endDate), 0);
    const reqWithin = overlap(lr.startDate, lr.endDate);
    if (used + reqWithin > (lr.type.maxDaysPerYear ?? 0)) {
      return NextResponse.json({ error: `Quota exceeded: used ${used} of ${lr.type.maxDaysPerYear} days` }, { status: 400 });
    }
  }

  // Update status
  await prisma.leaveRequest.update({ where: { id }, data: { status: "APPROVED", decidedById: userId, decidedAt: new Date() } });

  // Upsert staff attendance as LEAVE for the date range
  const start = dateOnlyUTC(new Date(lr.startDate));
  const end = dateOnlyUTC(new Date(lr.endDate));
  const countsAsPresence = Boolean(lr.type?.countsAsPresence);
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
    const date = d;
    const ex = await prisma.staffAttendance.findFirst({ where: { employeeId: lr.employeeId, date } });
    if (ex) {
      await prisma.staffAttendance.update({ where: { id: ex.id }, data: { status: countsAsPresence ? "PRESENT" : "LEAVE", method: countsAsPresence ? "OFFSITE" : ex.method, notes: lr.type?.name ? `${countsAsPresence ? "OFFSITE" : "LEAVE"}: ${lr.type.name}` : ex.notes ?? null } });
    } else {
      await prisma.staffAttendance.create({ data: { employeeId: lr.employeeId, date, status: countsAsPresence ? "PRESENT" : "LEAVE", method: countsAsPresence ? "OFFSITE" : null, notes: lr.type?.name ? `${countsAsPresence ? "OFFSITE" : "LEAVE"}: ${lr.type.name}` : null } });
    }
  }

  // Notify employee
  const emp = await prisma.employee.findUnique({ where: { id: lr.employeeId }, include: { user: true } });
  const payload = { startDate: lr.startDate, endDate: lr.endDate, days: lr.days, type: lr.type?.name } as any;
  await queueWa(emp?.user?.phone ?? null, "leave.approved", payload);
  await queueEmail(emp?.user?.email ?? null, "leave.approved", payload, "Pengajuan Cuti/Izin Disetujui");

  return NextResponse.json({ ok: true });
}
