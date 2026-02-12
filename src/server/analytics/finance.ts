import { prisma } from "@/lib/prisma";

export type InvoiceOutstandingByAcademicYearItem = {
  academicYearId: string;
  academicYearName: string;
  isActive: boolean;
  count: number;
  amount: number;
};

export async function getInvoiceOutstandingByAcademicYear(): Promise<InvoiceOutstandingByAcademicYearItem[]> {
  const rows = await prisma.invoice.groupBy({
    by: ["academicYearId"],
    where: { status: { in: ["OPEN", "PARTIAL"] } },
    _count: { _all: true },
    _sum: { total: true },
  });

  if (rows.length === 0) return [];

  const years = await prisma.academicYear.findMany({
    where: { id: { in: rows.map((r) => r.academicYearId) } },
    select: { id: true, name: true, isActive: true },
  });
  const yearById = new Map(years.map((y) => [y.id, y]));

  const items = rows.map((r) => {
    const year = yearById.get(r.academicYearId);
    return {
      academicYearId: r.academicYearId,
      academicYearName: year?.name ?? r.academicYearId,
      isActive: Boolean(year?.isActive),
      count: r._count._all ?? 0,
      amount: r._sum.total ?? 0,
    };
  });

  // Active academic year first, then most outstanding amount.
  items.sort((a, b) => Number(b.isActive) - Number(a.isActive) || b.amount - a.amount);
  return items;
}

