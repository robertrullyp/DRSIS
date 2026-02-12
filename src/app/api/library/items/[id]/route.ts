import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { libItemUpdateSchema } from "@/lib/schemas/library";
import { writeAuditEvent } from "@/server/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = libItemUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = parsed.data;
  // If copies updated, ensure available not exceeding copies; keep available as-is if not provided
  const current = await prisma.libItem.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });
  const update: typeof data & { available?: number } = { ...data };
  if (typeof data.copies !== "undefined") {
    const delta = data.copies - current.copies;
    update.available = Math.max(0, (current.available ?? 0) + delta);
  }
  const updated = await prisma.libItem.update({ where: { id }, data: update });
  await writeAuditEvent(prisma, {
    actorId,
    type: "library.item.update",
    entity: "LibItem",
    entityId: id,
    meta: { code: updated.code, title: updated.title, copies: updated.copies, available: updated.available },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.libItem.delete({ where: { id } });
  await writeAuditEvent(prisma, {
    actorId,
    type: "library.item.delete",
    entity: "LibItem",
    entityId: id,
    meta: null,
  });
  return NextResponse.json({ ok: true });
}
