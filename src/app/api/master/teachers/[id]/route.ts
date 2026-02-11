import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { teacherUpdateSchema } from "@/lib/schemas/master";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.teacher.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = teacherUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { name, email, nidn, hireDate } = parsed.data;

  const updated = await prisma.teacher.update({
    where: { id },
    data: {
      nidn: nidn ?? undefined,
      hireDate: hireDate ?? undefined,
      user: name || email ? { update: { name: name ?? undefined, email: email ?? undefined } } : undefined,
    },
    include: { user: true },
  });
  return NextResponse.json(updated);
}

