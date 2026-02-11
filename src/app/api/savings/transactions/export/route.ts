import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });
  const startStr = req.nextUrl.searchParams.get("start");
  const endStr = req.nextUrl.searchParams.get("end");
  const where: any = { accountId };
  if (startStr && endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) where.createdAt = { gte: start, lte: end };
  }
  const txns = await prisma.savingsTransaction.findMany({ where, orderBy: { createdAt: "asc" } });
  const header = ["Time","Type","Amount"].join(",");
  const lines = txns.map((t) => [new Date(t.createdAt).toISOString(), t.type, String(t.amount)].join(","));
  const csv = [header, ...lines].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=txn_${accountId}.csv` } });
}

