import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { libSettingsUpdateSchema } from "@/lib/schemas/library";
import { writeAuditEvent } from "@/server/audit";

export async function GET() {
  const s = (await prisma.libSetting.findFirst()) || (await prisma.libSetting.create({ data: {} }));
  return NextResponse.json(s);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = libSettingsUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = (await prisma.libSetting.findFirst()) || (await prisma.libSetting.create({ data: {} }));
  const updated = await prisma.libSetting.update({ where: { id: existing.id }, data: parsed.data });
  await writeAuditEvent(prisma, {
    actorId,
    type: "library.settings.update",
    entity: "LibSetting",
    entityId: updated.id,
    meta: parsed.data,
  });
  return NextResponse.json(updated);
}
