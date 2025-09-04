import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { assetMaintenanceCreateSchema } from "@/lib/schemas/assets";

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
  const { assetId, type, date, cost, notes } = parsed.data;
  const created = await prisma.assetMaintenance.create({ data: { assetId, type, date: date ?? undefined, cost: cost ?? 0, notes: notes ?? undefined } });
  return NextResponse.json(created, { status: 201 });
}

