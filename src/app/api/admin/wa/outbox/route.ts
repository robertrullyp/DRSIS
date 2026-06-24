import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/server/api/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, ["notification.manage"]);
  if (!auth.ok) return auth.response;

  const status = req.nextUrl.searchParams.get("status") || undefined;
  const to = req.nextUrl.searchParams.get("to") || undefined;
  const where: any = {};
  if (status) where.status = status;
  if (to) where.to = { contains: to };
  const items = await prisma.waOutbox.findMany({ where, orderBy: { sentAt: "desc" }, take: 200, include: { template: true } });
  return NextResponse.json({ items });
}
