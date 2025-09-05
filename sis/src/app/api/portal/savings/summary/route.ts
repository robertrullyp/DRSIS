import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

function signAmount(type: string, amount: number, approvedBy: string | null) {
  if (type === "WITHDRAWAL") return approvedBy ? -amount : 0;
  return amount;
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
  if (!user?.student) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const startStr = req.nextUrl.searchParams.get("start");
  const endStr = req.nextUrl.searchParams.get("end");
  if (!startStr || !endStr) return NextResponse.json({ error: "start and end required" }, { status: 400 });
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return NextResponse.json({ error: "invalid date" }, { status: 400 });

  const acc = await prisma.savingsAccount.findUnique({ where: { studentId: user.student.id } });
  if (!acc) return NextResponse.json({ opening: 0, inflow: 0, outflow: 0, closing: 0, start, end });

  const [before, within] = await Promise.all([
    prisma.savingsTransaction.findMany({ where: { accountId: acc.id, createdAt: { lt: start } }, orderBy: { createdAt: "asc" } }),
    prisma.savingsTransaction.findMany({ where: { accountId: acc.id, createdAt: { gte: start, lte: end } }, orderBy: { createdAt: "asc" } }),
  ]);

  const opening = before.reduce((b, t) => b + signAmount(t.type, t.amount, (t as any).approvedBy ?? null), 0);
  const inflow = within.filter((t) => t.type !== "WITHDRAWAL").reduce((b, t) => b + t.amount, 0);
  const outflow = within.filter((t) => t.type === "WITHDRAWAL" && (t as any).approvedBy).reduce((b, t) => b + t.amount, 0);
  const closing = opening + inflow - outflow;
  return NextResponse.json({ opening, inflow, outflow, closing, start, end });
}

