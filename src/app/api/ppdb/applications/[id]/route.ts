import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ppdbApplicationUpdateSchema } from "@/lib/schemas/ppdb";
import { getToken } from "next-auth/jwt";
import { writeAuditEvent } from "@/server/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.admissionApplication.findUnique({ where: { id }, include: { gradeApplied: true } });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = ppdbApplicationUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const updated = await prisma.admissionApplication.update({ where: { id }, data: parsed.data, include: { gradeApplied: true } });
  await writeAuditEvent(prisma, {
    actorId,
    type: "ppdb.application.update",
    entity: "AdmissionApplication",
    entityId: id,
    meta: parsed.data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.admissionApplication.delete({ where: { id } });
  await writeAuditEvent(prisma, {
    actorId,
    type: "ppdb.application.delete",
    entity: "AdmissionApplication",
    entityId: id,
    meta: null,
  });
  return NextResponse.json({ ok: true });
}
