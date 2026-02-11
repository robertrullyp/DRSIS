import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extraEventCreateSchema } from "@/lib/schemas/extras";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await prisma.extraEvent.findMany({ where: { extracurricularId: id }, orderBy: { date: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = extraEventCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const created = await prisma.extraEvent.create({ data: { extracurricularId: id, ...parsed.data } });
  return NextResponse.json(created, { status: 201 });
}

