import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { studentGuardianUpdateSchema } from "@/lib/schemas/master";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; linkId: string }> }) {
  const { id: studentId, linkId } = await params;
  const body = await req.json();
  const parsed = studentGuardianUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  if (typeof parsed.data.relation === "undefined" && typeof parsed.data.isPrimary === "undefined") {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const existing = await prisma.studentGuardian.findUnique({ where: { id: linkId } });
  if (!existing || existing.studentId !== studentId) {
    return NextResponse.json({ error: "Guardian relation not found" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.isPrimary) {
      await tx.studentGuardian.updateMany({
        where: { studentId },
        data: { isPrimary: false },
      });
    }

    return tx.studentGuardian.update({
      where: { id: linkId },
      data: {
        relation: parsed.data.relation,
        isPrimary: parsed.data.isPrimary,
      },
      include: {
        guardianUser: {
          include: {
            role: true,
          },
        },
      },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; linkId: string }> }) {
  const { id: studentId, linkId } = await params;

  const existing = await prisma.studentGuardian.findUnique({ where: { id: linkId } });
  if (!existing || existing.studentId !== studentId) {
    return NextResponse.json({ error: "Guardian relation not found" }, { status: 404 });
  }

  await prisma.studentGuardian.delete({ where: { id: linkId } });
  return NextResponse.json({ ok: true });
}
