import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const roleId: string | null | undefined = body.roleId;
  const status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined = body.status;

  const data: Record<string, unknown> = {};
  if (typeof roleId !== "undefined") data.roleId = roleId;
  if (typeof status !== "undefined") data.status = status;

  const updated = await prisma.user.update({ where: { id }, data, include: { role: true } });
  return NextResponse.json(updated);
}

