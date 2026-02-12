import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { writeAuditEvent } from "@/server/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await prisma.libBarcode.findMany({ where: { itemId: id } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const barcode: string | undefined = body.barcode;
  if (!barcode) return NextResponse.json({ error: "barcode required" }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const created = await prisma.libBarcode.create({ data: { itemId: id, barcode } });
    await writeAuditEvent(prisma, {
      actorId,
      type: "library.barcode.create",
      entity: "LibBarcode",
      entityId: created.id,
      meta: { itemId: created.itemId, barcode: created.barcode },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "duplicate or invalid barcode" }, { status: 400 });
  }
}
