import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const startStr = req.nextUrl.searchParams.get("start");
  const endStr = req.nextUrl.searchParams.get("end");
  const where: any = {};
  if (startStr && endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) where.createdAt = { gte: start, lte: end };
  }
  const [open, partial, paid] = await Promise.all([
    prisma.invoice.aggregate({ _sum: { total: true }, _count: { _all: true }, where: { ...where, status: "OPEN" } }),
    prisma.invoice.aggregate({ _sum: { total: true }, _count: { _all: true }, where: { ...where, status: "PARTIAL" } }),
    prisma.invoice.aggregate({ _sum: { total: true }, _count: { _all: true }, where: { ...where, status: "PAID" } }),
  ]);
  return NextResponse.json({
    open: { amount: open._sum.total ?? 0, count: open._count._all },
    partial: { amount: partial._sum.total ?? 0, count: partial._count._all },
    paid: { amount: paid._sum.total ?? 0, count: paid._count._all },
  });
}

