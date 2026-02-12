import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ppdbApplicationCreateSchema, ppdbQuerySchema } from "@/lib/schemas/ppdb";
import { getToken } from "next-auth/jwt";
import { writeAuditEvent } from "@/server/audit";

export async function GET(req: NextRequest) {
  const parse = ppdbQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, q, status } = parse.data;
  const where: Record<string, unknown> = {};
  if (q) Object.assign(where, { OR: [{ fullName: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] });
  if (status) (where as any).status = status;
  const [items, total] = await Promise.all([
    prisma.admissionApplication.findMany({ where, include: { gradeApplied: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.admissionApplication.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ppdbApplicationCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const created = await prisma.admissionApplication.create({ data: parsed.data });
  await writeAuditEvent(prisma, {
    actorId,
    type: "ppdb.application.create",
    entity: "AdmissionApplication",
    entityId: created.id,
    meta: { source: "admin", status: created.status, gradeAppliedId: created.gradeAppliedId },
  });
  return NextResponse.json(created, { status: 201 });
}
