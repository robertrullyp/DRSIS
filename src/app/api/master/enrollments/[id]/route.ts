import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrollmentUpdateSchema } from "@/lib/schemas/master";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = enrollmentUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const updated = await prisma.enrollment.update({
    where: { id },
    data: parsed.data,
    include: { student: { include: { user: true } }, classroom: true, academicYear: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.enrollment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
