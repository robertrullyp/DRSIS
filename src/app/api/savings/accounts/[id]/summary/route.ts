import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function signAmount(type: string, amount: number, approvedBy: string | null) {
  if (type === "WITHDRAWAL") return approvedBy ? -amount : 0;
  return amount;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const startStr = req.nextUrl.searchParams.get("start");
  const endStr = req.nextUrl.searchParams.get("end");
  if (!startStr || !endStr) return NextResponse.json({ error: "start and end required" }, { status: 400 });
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return NextResponse.json({ error: "invalid date" }, { status: 400 });

  const [before, within] = await Promise.all([
    prisma.savingsTransaction.findMany({ where: { accountId: id, createdAt: { lt: start } }, orderBy: { createdAt: "asc" } }),
    prisma.savingsTransaction.findMany({ where: { accountId: id, createdAt: { gte: start, lte: end } }, orderBy: { createdAt: "asc" } }),
  ]);

  const opening = before.reduce((b, t) => b + signAmount(t.type, t.amount, (t as any).approvedBy ?? null), 0);
  const inflow = within.filter((t) => t.type !== "WITHDRAWAL").reduce((b, t) => b + t.amount, 0);
  const outflow = within.filter((t) => t.type === "WITHDRAWAL" && (t as any).approvedBy).reduce((b, t) => b + t.amount, 0);
  const closing = opening + inflow - outflow;
  return NextResponse.json({ opening, inflow, outflow, closing, start, end });
}
