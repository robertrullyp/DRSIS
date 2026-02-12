import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { libItemCreateSchema } from "@/lib/schemas/library";
import { writeAuditEvent } from "@/server/audit";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, q } = parse.data;
  const where = q
    ? {
        OR: [
          { code: { contains: q, mode: "insensitive" as const } },
          { title: { contains: q, mode: "insensitive" as const } },
          { author: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.libItem.findMany({ where, orderBy: { title: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.libItem.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = libItemCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = parsed.data;
  const created = await prisma.libItem.create({ data: { ...data, available: data.copies } });
  await writeAuditEvent(prisma, {
    actorId,
    type: "library.item.create",
    entity: "LibItem",
    entityId: created.id,
    meta: { code: created.code, title: created.title, copies: created.copies },
  });
  return NextResponse.json(created, { status: 201 });
}
