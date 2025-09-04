import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  try {
    const created = await prisma.libBarcode.create({ data: { itemId: id, barcode } });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "duplicate or invalid barcode" }, { status: 400 });
  }
}

