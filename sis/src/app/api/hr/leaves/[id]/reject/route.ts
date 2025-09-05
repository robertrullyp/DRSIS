import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { queueWa, queueEmail } from "@/lib/notify";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lr = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!lr) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.leaveRequest.update({ where: { id }, data: { status: "REJECTED", decidedById: userId, decidedAt: new Date() } });
  const emp = await prisma.employee.findUnique({ where: { id: lr.employeeId }, include: { user: true } });
  const payload = { startDate: lr.startDate, endDate: lr.endDate, days: lr.days } as any;
  await queueWa(emp?.user?.phone ?? null, "leave.rejected", payload);
  await queueEmail(emp?.user?.email ?? null, "leave.rejected", payload, "Pengajuan Cuti/Izin Ditolak");
  return NextResponse.json({ ok: true });
}
