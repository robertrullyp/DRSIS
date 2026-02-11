import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const content = String(body?.content || "");
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
  const updated = await prisma.waTemplate.update({ where: { id }, data: { content, variables: body?.variables ?? null } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.waTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

