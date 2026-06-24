import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rolePermissionsUpdateSchema } from "@/lib/schemas/admin";
import { requireApiPermission } from "@/server/api/auth";
import { writeAuditEvent } from "@/server/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(req, ["identity.manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const links = await prisma.rolePermission.findMany({ where: { roleId: id } });
  return NextResponse.json({ permissionIds: links.map((l) => l.permissionId) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(req, ["identity.manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const parsed = rolePermissionsUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { permissionIds } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: id } });
    await tx.rolePermission.createMany({
      data: permissionIds.map((pid) => ({ roleId: id, permissionId: pid })),
      skipDuplicates: true,
    });
    await writeAuditEvent(tx, {
      actorId: auth.context.userId,
      type: "identity.role.permissions.update",
      entity: "Role",
      entityId: id,
      meta: { permissionCount: permissionIds.length },
    });
  });

  return NextResponse.json({ ok: true });
}
