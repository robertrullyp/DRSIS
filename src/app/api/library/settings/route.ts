import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { libSettingsUpdateSchema } from "@/lib/schemas/library";

export async function GET() {
  const s = (await prisma.libSetting.findFirst()) || (await prisma.libSetting.create({ data: {} }));
  return NextResponse.json(s);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = libSettingsUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const existing = (await prisma.libSetting.findFirst()) || (await prisma.libSetting.create({ data: {} }));
  const updated = await prisma.libSetting.update({ where: { id: existing.id }, data: parsed.data });
  return NextResponse.json(updated);
}

