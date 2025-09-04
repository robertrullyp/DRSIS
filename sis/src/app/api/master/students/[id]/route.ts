import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { studentUpdateSchema } from "@/lib/schemas/master";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.student.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = studentUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { name, email, nis, nisn, gender, birthDate, startYear, guardianName } = parsed.data;

  const updated = await prisma.student.update({
    where: { id },
    data: {
      nis: nis ?? undefined,
      nisn: nisn ?? undefined,
      gender: gender ?? undefined,
      birthDate: birthDate ?? undefined,
      startYear: startYear ?? undefined,
      guardianName: guardianName ?? undefined,
      user: name || email ? { update: { name: name ?? undefined, email: email ?? undefined } } : undefined,
    },
    include: { user: true },
  });
  return NextResponse.json(updated);
}

