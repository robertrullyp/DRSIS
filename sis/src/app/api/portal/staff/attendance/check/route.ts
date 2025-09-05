import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await prisma.employee.findUnique({ where: { userId } });
  if (!me) return NextResponse.json({ error: "Not an employee" }, { status: 403 });

  const body = await req.json();
  const action = body?.action === "checkout" ? "checkout" : "checkin";
  const method = body?.method || "WEB";
  const shiftId = body?.shiftId as string | undefined;
  const latitude = typeof body?.latitude === "number" ? body.latitude : undefined;
  const longitude = typeof body?.longitude === "number" ? body.longitude : undefined;
  const note = typeof body?.note === "string" ? body.note : undefined;
  const date = body?.date ? new Date(body.date) : new Date();

  // Proxy to core endpoint with enforced employeeId
  const result = await prisma.$transaction(async (tx) => {
    // emulate logic from /api/hr/attendance/check but scoped to me
    function dateOnlyUTC(d: Date) { return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }
    const today = dateOnlyUTC(date);
    const existing = await tx.staffAttendance.findFirst({ where: { employeeId: me.id, date: today } });
    const { computeStatusForCheckIn } = await import("@/lib/hr-rules");
    if (!existing) {
      return tx.staffAttendance.create({
        data: {
          employeeId: me.id,
          date: today,
          shiftId: shiftId ?? null,
          status: action === "checkin" ? computeStatusForCheckIn(shiftId ? (await tx.staffShift.findUnique({ where: { id: shiftId } }))?.startTime ?? null : null, new Date()) : "PRESENT",
          checkInAt: action === "checkin" ? new Date() : null,
          checkOutAt: action === "checkout" ? new Date() : null,
          method,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          notes: note ?? null,
        },
      });
    }
    return tx.staffAttendance.update({
      where: { id: existing.id },
      data: {
        shiftId: shiftId ?? existing.shiftId,
        status: action === "checkin" ? computeStatusForCheckIn((shiftId ? (await tx.staffShift.findUnique({ where: { id: shiftId } }))?.startTime : existing.shiftId ? (await tx.staffShift.findUnique({ where: { id: existing.shiftId } }))?.startTime : null) ?? null, new Date()) : existing.status ?? "PRESENT",
        checkInAt: action === "checkin" ? new Date() : existing.checkInAt,
        checkOutAt: action === "checkout" ? new Date() : existing.checkOutAt,
        method,
        latitude: latitude ?? existing.latitude,
        longitude: longitude ?? existing.longitude,
        notes: note ?? existing.notes,
      },
    });
  });

  return NextResponse.json(result);
}
