import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { counselingTicketUpdateSchema } from "@/lib/schemas/counseling";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.counselingTicket.findUnique({ where: { id }, include: { student: { include: { user: true } }, createdBy: true } });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = counselingTicketUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const updated = await prisma.counselingTicket.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

