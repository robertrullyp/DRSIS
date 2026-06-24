import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/server/api/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(req, ["notification.manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const subject = String(body?.subject || "");
  const content = String(body?.content || "");
  if (!subject || !content) return NextResponse.json({ error: "subject and content required" }, { status: 400 });
  const updated = await prisma.emailTemplate.update({ where: { id }, data: { subject, content, variables: body?.variables ?? null } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(req, ["notification.manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await prisma.emailTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
