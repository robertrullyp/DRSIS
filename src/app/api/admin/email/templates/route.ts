import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.emailTemplate.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const key = String(body?.key || "").trim();
  const subject = String(body?.subject || "");
  const content = String(body?.content || "");
  if (!key || !subject || !content) return NextResponse.json({ error: "key, subject, content required" }, { status: 400 });
  const created = await prisma.emailTemplate.create({ data: { key, subject, content, variables: body?.variables ?? null } });
  return NextResponse.json(created, { status: 201 });
}

