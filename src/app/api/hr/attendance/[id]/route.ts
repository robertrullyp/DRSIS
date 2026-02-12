import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { staffAttendanceUpdateSchema } from "@/lib/schemas/hr";
import { getToken } from "next-auth/jwt";
import { writeAuditEvent } from "@/server/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = staffAttendanceUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = (token as any)?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data: any = {};
  const { status, checkInAt, checkOutAt, notes, shiftId, approve } = parsed.data;
  if (typeof status !== "undefined") data.status = status;
  if (typeof checkInAt !== "undefined") data.checkInAt = checkInAt;
  if (typeof checkOutAt !== "undefined") data.checkOutAt = checkOutAt;
  if (typeof notes !== "undefined") data.notes = notes;
  if (typeof shiftId !== "undefined") data.shiftId = shiftId;

  if (approve) {
    data.approvedBy = actorId;
  }

  const updated = await prisma.staffAttendance.update({ where: { id }, data });
  await writeAuditEvent(prisma, {
    actorId,
    type: approve ? "hr.attendance.approve" : "hr.attendance.update",
    entity: "StaffAttendance",
    entityId: id,
    meta: {
      changes: parsed.data,
      approvedBy: approve ? actorId : undefined,
      status: updated.status,
      date: updated.date.toISOString(),
      employeeId: updated.employeeId,
    },
  });
  return NextResponse.json(updated);
}
