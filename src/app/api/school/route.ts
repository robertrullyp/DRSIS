import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { schoolProfileSchema, schoolProfileUpdateSchema } from "@/lib/schemas/master";
import { getToken } from "next-auth/jwt";

export async function GET() {
  const found = await prisma.schoolProfile.findFirst({});
  if (!found) return NextResponse.json(null);
  return NextResponse.json(found);
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const roles = (token as any)?.roles as string[] | undefined;
  const perms = (token as any)?.permissions as string[] | undefined;
  const allowed = Boolean(roles?.includes("admin") || perms?.includes("master.write"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  // accept both full and partial updates
  const parsed = (body?.name ? schoolProfileSchema.safeParse(body) : schoolProfileUpdateSchema.safeParse(body));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;

  const existing = await prisma.schoolProfile.findFirst({});
  if (existing) {
    const updated = await prisma.schoolProfile.update({ where: { id: existing.id }, data });
    return NextResponse.json(updated);
  }
  const created = await prisma.schoolProfile.create({ data: data as any });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const roles = (token as any)?.roles as string[] | undefined;
  const perms = (token as any)?.permissions as string[] | undefined;
  const allowed = Boolean(roles?.includes("admin") || perms?.includes("master.write"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.schoolProfile.findFirst({});
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.schoolProfile.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
