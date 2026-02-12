import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { shiftUpdateSchema } from "@/lib/schemas/hr";
import { writeAuditEvent } from "@/server/audit";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.staffShift.delete({ where: { id } });
  await writeAuditEvent(prisma, {
    actorId,
    type: "hr.shift.delete",
    entity: "StaffShift",
    entityId: id,
    meta: null,
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = shiftUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const updated = await prisma.staffShift.update({ where: { id }, data: parsed.data });
  await writeAuditEvent(prisma, {
    actorId,
    type: "hr.shift.update",
    entity: "StaffShift",
    entityId: id,
    meta: { name: updated.name, startTime: updated.startTime, endTime: updated.endTime },
  });
  return NextResponse.json(updated);
}
