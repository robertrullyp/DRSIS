import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/server/api/auth";
import { writeAuditEvent } from "@/server/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(req, ["identity.manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const roleId: string | null | undefined = body.roleId;
  const status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined = body.status;

  const data: Record<string, unknown> = {};
  if (typeof roleId !== "undefined") data.roleId = roleId;
  if (typeof status !== "undefined") data.status = status;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id }, data, include: { role: true } });
    await writeAuditEvent(tx, {
      actorId: auth.context.userId,
      type: "identity.user.update",
      entity: "User",
      entityId: id,
      meta: { roleId: data.roleId ?? undefined, status: data.status ?? undefined },
    });
    return user;
  });
  return NextResponse.json(updated);
}
