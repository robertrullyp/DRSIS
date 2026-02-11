import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ppdbVerifySchema } from "@/lib/schemas/ppdb";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = ppdbVerifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const verified = parsed.data.verified;
  const updated = await prisma.admissionApplication.update({ where: { id }, data: { status: verified ? "VERIFIED" : "PENDING", verifiedAt: verified ? new Date() : null } });
  return NextResponse.json(updated);
}

