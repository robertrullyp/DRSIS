import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { assetMaintenanceCreateSchema } from "@/lib/schemas/assets";
import { writeAuditEvent } from "@/server/audit";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize } = parse.data;
  const assetId = req.nextUrl.searchParams.get("assetId") || undefined;
  const where: Record<string, unknown> = {};
  if (assetId) (where as any).assetId = assetId;
  const [items, total] = await Promise.all([
    prisma.assetMaintenance.findMany({ where, include: { asset: true }, orderBy: { date: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.assetMaintenance.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = assetMaintenanceCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { assetId, type, date, cost, notes } = parsed.data;
  const created = await prisma.assetMaintenance.create({ data: { assetId, type, date: date ?? undefined, cost: cost ?? 0, notes: notes ?? undefined } });
  await writeAuditEvent(prisma, {
    actorId,
    type: "asset.maintenance.create",
    entity: "AssetMaintenance",
    entityId: created.id,
    meta: {
      assetId: created.assetId,
      maintenanceType: created.type,
      date: created.date?.toISOString() ?? null,
      cost: created.cost,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
