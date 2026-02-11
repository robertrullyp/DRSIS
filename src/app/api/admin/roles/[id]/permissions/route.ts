import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rolePermissionsUpdateSchema } from "@/lib/schemas/admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const links = await prisma.rolePermission.findMany({ where: { roleId: id } });
  return NextResponse.json({ permissionIds: links.map((l) => l.permissionId) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = rolePermissionsUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { permissionIds } = parsed.data;

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: id } }),
    prisma.rolePermission.createMany({ data: permissionIds.map((pid) => ({ roleId: id, permissionId: pid })), skipDuplicates: true }),
  ]);

  return NextResponse.json({ ok: true });
}

