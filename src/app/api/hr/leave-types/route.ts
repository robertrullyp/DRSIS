import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { leaveTypeCreateSchema } from "@/lib/schemas/hr";
import { writeAuditEvent } from "@/server/audit";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, q } = parse.data as any;
  const where: any = q ? { OR: [{ name: { contains: q, mode: "insensitive" } }] } : {};
  const [items, total] = await Promise.all([
    prisma.leaveType.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.leaveType.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = leaveTypeCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const created = await prisma.leaveType.create({ data: parsed.data });
  await writeAuditEvent(prisma, {
    actorId,
    type: "hr.leave-type.create",
    entity: "LeaveType",
    entityId: created.id,
    meta: { name: created.name, maxDaysPerYear: created.maxDaysPerYear, countsAsPresence: created.countsAsPresence },
  });
  return NextResponse.json(created, { status: 201 });
}
