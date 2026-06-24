import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/server/api/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, ["identity.manage"]);
  if (!auth.ok) return auth.response;

  const items = await prisma.role.findMany({ orderBy: { name: "asc" }, include: { perms: { include: { permission: true } } } });
  return NextResponse.json({ items });
}
