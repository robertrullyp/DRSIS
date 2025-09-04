import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extraUpdateSchema } from "@/lib/schemas/extras";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = extraUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const updated = await prisma.extracurricular.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.extracurricular.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

