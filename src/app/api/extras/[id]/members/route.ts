import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extraMemberCreateSchema } from "@/lib/schemas/extras";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await prisma.extraMember.findMany({ where: { extracurricularId: id }, include: { student: { include: { user: true } } }, orderBy: { joinedAt: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = extraMemberCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { studentId } = parsed.data;
  // prevent duplicate membership
  const exists = await prisma.extraMember.findFirst({ where: { extracurricularId: id, studentId } });
  if (exists) return NextResponse.json(exists);
  const created = await prisma.extraMember.create({ data: { extracurricularId: id, studentId } });
  return NextResponse.json(created, { status: 201 });
}

