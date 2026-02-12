import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scholarshipUpdateSchema } from "@/lib/schemas/finance";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = scholarshipUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const updated = await prisma.scholarship.update({
    where: { id },
    data: {
      ...parsed.data,
      endDate:
        typeof parsed.data.endDate === "undefined"
          ? undefined
          : parsed.data.endDate ?? null,
    },
    include: { student: { include: { user: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.scholarship.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
