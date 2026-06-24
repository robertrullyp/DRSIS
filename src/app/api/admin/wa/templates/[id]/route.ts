import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/server/api/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(req, ["notification.manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const content = String(body?.content || "");
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
  const updated = await prisma.waTemplate.update({ where: { id }, data: { content, variables: body?.variables ?? null } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(req, ["notification.manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await prisma.waTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
