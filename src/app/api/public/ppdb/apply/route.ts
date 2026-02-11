import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ppdbApplicationCreateSchema } from "@/lib/schemas/ppdb";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ppdbApplicationCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const created = await prisma.admissionApplication.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}

