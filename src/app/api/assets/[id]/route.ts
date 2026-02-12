import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { assetUpdateSchema } from "@/lib/schemas/assets";
import { writeAuditEvent } from "@/server/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = assetUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const updated = await prisma.asset.update({ where: { id }, data: parsed.data });
  await writeAuditEvent(prisma, {
    actorId,
    type: "asset.asset.update",
    entity: "Asset",
    entityId: id,
    meta: { code: updated.code, name: updated.name, categoryId: updated.categoryId, location: updated.location ?? null },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.asset.delete({ where: { id } });
  await writeAuditEvent(prisma, {
    actorId,
    type: "asset.asset.delete",
    entity: "Asset",
    entityId: id,
    meta: null,
  });
  return NextResponse.json({ ok: true });
}
