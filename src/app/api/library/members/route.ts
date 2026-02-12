import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { libMemberCreateSchema } from "@/lib/schemas/library";
import { writeAuditEvent } from "@/server/audit";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, q } = parse.data;
  const where = q
    ? {
        OR: [
          { user: { name: { contains: q, mode: "insensitive" as const } } },
          { student: { user: { name: { contains: q, mode: "insensitive" as const } } } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.libMember.findMany({ where, include: { user: true, student: { include: { user: true } } }, orderBy: { joinedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.libMember.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = libMemberCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, studentId } = parsed.data;
  const created = await prisma.libMember.create({ data: { userId: userId ?? null, studentId: studentId ?? null } });
  await writeAuditEvent(prisma, {
    actorId,
    type: "library.member.create",
    entity: "LibMember",
    entityId: created.id,
    meta: { userId: created.userId, studentId: created.studentId },
  });
  return NextResponse.json(created, { status: 201 });
}
