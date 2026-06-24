import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/server/api/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, ["notification.manage"]);
  if (!auth.ok) return auth.response;

  const items = await prisma.emailTemplate.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, ["notification.manage"]);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const key = String(body?.key || "").trim();
  const subject = String(body?.subject || "");
  const content = String(body?.content || "");
  if (!key || !subject || !content) return NextResponse.json({ error: "key, subject, content required" }, { status: 400 });
  const created = await prisma.emailTemplate.create({ data: { key, subject, content, variables: body?.variables ?? null } });
  return NextResponse.json(created, { status: 201 });
}
