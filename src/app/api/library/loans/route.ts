import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { libLoanCreateSchema } from "@/lib/schemas/library";
import { writeAuditEvent } from "@/server/audit";

function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize } = parse.data;
  const memberId = req.nextUrl.searchParams.get("memberId") || undefined;
  const active = req.nextUrl.searchParams.get("active") || undefined;
  const where: Record<string, unknown> = {};
  if (memberId) (where as any).memberId = memberId;
  if (typeof active !== "undefined") (where as any).returnedAt = active === "true" ? null : { not: null };
  const [items, total] = await Promise.all([
    prisma.libLoan.findMany({ where, include: { item: true, member: { include: { user: true, student: { include: { user: true } } } } }, orderBy: { borrowedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.libLoan.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = libLoanCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { itemId, memberId } = parsed.data;
  const item = await prisma.libItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "item not found" }, { status: 404 });
  if ((item.available ?? 0) <= 0) return NextResponse.json({ error: "item not available" }, { status: 400 });
  const setting = (await prisma.libSetting.findFirst()) || (await prisma.libSetting.create({ data: {} }));
  // Enforce max loans per member
  const activeLoans = await prisma.libLoan.count({ where: { memberId, returnedAt: null } });
  const maxLoans = setting.maxLoans ?? 3;
  if (activeLoans >= maxLoans) return NextResponse.json({ error: "member has reached max active loans" }, { status: 400 });
  const now = new Date();
  const due = addDays(now, setting.loanDays ?? 7);
  const loan = await prisma.$transaction(async (tx) => {
    const created = await tx.libLoan.create({ data: { itemId, memberId, borrowedAt: now, dueAt: due } });
    await tx.libItem.update({ where: { id: itemId }, data: { available: (item.available ?? 0) - 1 } });
    return created;
  });
  await writeAuditEvent(prisma, {
    actorId,
    type: "library.loan.create",
    entity: "LibLoan",
    entityId: loan.id,
    meta: { itemId: loan.itemId, memberId: loan.memberId, dueAt: loan.dueAt?.toISOString() ?? null },
  });
  return NextResponse.json(loan, { status: 201 });
}
