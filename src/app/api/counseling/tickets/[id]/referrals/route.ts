import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { counselingReferralCreateSchema } from "@/lib/schemas/counseling";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await prisma.counselingReferral.findMany({ where: { ticketId: id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = counselingReferralCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const created = await prisma.counselingReferral.create({ data: { ticketId: id, referredTo: parsed.data.referredTo, notes: parsed.data.notes } });
  return NextResponse.json(created, { status: 201 });
}

