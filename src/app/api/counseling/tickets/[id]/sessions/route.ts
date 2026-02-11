import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { counselingSessionCreateSchema } from "@/lib/schemas/counseling";
import { getToken } from "next-auth/jwt";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await prisma.counselingSession.findMany({ where: { ticketId: id }, include: { counselor: true }, orderBy: { startedAt: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = counselingSessionCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const counselorUserId = (token as any)?.sub as string | undefined;
  if (!counselorUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const created = await prisma.counselingSession.create({ data: { ticketId: id, counselorUserId, notes: parsed.data.notes, endedAt: parsed.data.endedAt } });
  return NextResponse.json(created, { status: 201 });
}
