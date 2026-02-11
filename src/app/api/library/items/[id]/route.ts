import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { libItemUpdateSchema } from "@/lib/schemas/library";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = libItemUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;
  // If copies updated, ensure available not exceeding copies; keep available as-is if not provided
  const current = await prisma.libItem.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });
  const update: typeof data & { available?: number } = { ...data };
  if (typeof data.copies !== "undefined") {
    const delta = data.copies - current.copies;
    update.available = Math.max(0, (current.available ?? 0) + delta);
  }
  const updated = await prisma.libItem.update({ where: { id }, data: update });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.libItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
