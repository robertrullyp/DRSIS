import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shiftUpdateSchema } from "@/lib/schemas/hr";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.staffShift.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = shiftUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const updated = await prisma.staffShift.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

