import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { staffCheckSchema } from "@/lib/schemas/hr";
import { computeStatusForCheckIn } from "@/lib/hr-rules";

function dateOnlyUTC(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = staffCheckSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { employeeId, action, method, latitude, longitude, note, shiftId } = parsed.data;
  const date = parsed.data.date ? dateOnlyUTC(parsed.data.date) : dateOnlyUTC(new Date());

  const existing = await prisma.staffAttendance.findFirst({ where: { employeeId, date } });
  if (!existing) {
    const created = await prisma.staffAttendance.create({
      data: {
        employeeId,
        date,
        shiftId: shiftId ?? null,
        status: action === "checkin" ? computeStatusForCheckIn(
          shiftId ? (await prisma.staffShift.findUnique({ where: { id: shiftId } }))?.startTime ?? null : null,
          new Date()
        ) : "PRESENT",
        checkInAt: action === "checkin" ? new Date() : null,
        checkOutAt: action === "checkout" ? new Date() : null,
        method: method ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        notes: note ?? null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } else {
    const updated = await prisma.staffAttendance.update({
      where: { id: existing.id },
      data: {
        shiftId: shiftId ?? existing.shiftId,
        status:
          action === "checkin"
            ? computeStatusForCheckIn(
                (shiftId
                  ? (await prisma.staffShift.findUnique({ where: { id: shiftId } }))?.startTime
                  : existing.shiftId
                  ? (await prisma.staffShift.findUnique({ where: { id: existing.shiftId } }))?.startTime
                  : null) ?? null,
                new Date()
              )
            : existing.status ?? "PRESENT",
        checkInAt: action === "checkin" ? new Date() : existing.checkInAt,
        checkOutAt: action === "checkout" ? new Date() : existing.checkOutAt,
        method: method ?? existing.method,
        latitude: latitude ?? existing.latitude,
        longitude: longitude ?? existing.longitude,
        notes: note ?? existing.notes,
      },
    });
    return NextResponse.json(updated);
  }
}
