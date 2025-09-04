import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { counselingTicketCreateSchema } from "@/lib/schemas/counseling";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const parse = paginationSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize } = parse.data;
  const [items, total] = await Promise.all([
    prisma.counselingTicket.findMany({ include: { student: { include: { user: true } }, createdBy: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.counselingTicket.count(),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = counselingTicketCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const creatorId = (token as any)?.sub as string | undefined;
  const created = await prisma.counselingTicket.create({ data: { ...parsed.data, createdByUserId: creatorId ?? "" } });
  return NextResponse.json(created, { status: 201 });
}

