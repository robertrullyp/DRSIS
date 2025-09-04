import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const monthStr = req.nextUrl.searchParams.get("month"); // YYYY-MM
  const month = monthStr || new Date().toISOString().slice(0, 7);
  const assets = await prisma.asset.findMany({ include: { category: true } });
  const items = assets.map((a) => {
    const rate = a.depreciationRate ?? 0;
    const monthly = ((a.value ?? 0) * rate) / 12;
    return {
      id: a.id,
      code: a.code,
      name: a.name,
      category: a.category?.name ?? null,
      month,
      monthlyDepreciation: Math.round(monthly),
      notes: a.notes ?? null,
    };
  });
  const total = items.reduce((acc, x) => acc + x.monthlyDepreciation, 0);
  return NextResponse.json({ items, month, total });
}

