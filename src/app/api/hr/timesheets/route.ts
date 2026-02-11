import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCoreHoursMet } from "@/lib/hr-rules";

function hoursBetween(a?: Date | null, b?: Date | null) {
  if (!a || !b) return 0;
  const ms = b.getTime() - a.getTime();
  return ms > 0 ? ms / (1000 * 60 * 60) : 0;
}

export async function GET(req: NextRequest) {
  const startStr = req.nextUrl.searchParams.get("start");
  const endStr = req.nextUrl.searchParams.get("end");
  if (!startStr || !endStr) return NextResponse.json({ error: "start and end required" }, { status: 400 });
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return NextResponse.json({ error: "invalid date" }, { status: 400 });

  const rows = await prisma.staffAttendance.findMany({
    where: { date: { gte: start, lte: end } },
    include: { employee: { include: { user: true } }, shift: true },
    orderBy: [{ employeeId: "asc" }, { date: "asc" }],
  });

  const map = new Map<string, { employeeId: string; name: string; days: number; present: number; late: number; absent: number; hours: number; coreMet: number }>();
  for (const r of rows) {
    const key = r.employeeId;
    const name = r.employee.user?.name ?? r.employeeId;
    const agg = map.get(key) || { employeeId: key, name, days: 0, present: 0, late: 0, absent: 0, hours: 0, coreMet: 0 };
    agg.days += 1;
    if (r.status === "PRESENT") agg.present += 1;
    if (r.status === "LATE") agg.late += 1;
    if (r.status === "ABSENT") agg.absent += 1;
    agg.hours += hoursBetween(r.checkInAt, r.checkOutAt);
    if (computeCoreHoursMet(r.shift?.startTime ?? null, r.shift?.endTime ?? null, r.checkInAt ?? undefined, r.checkOutAt ?? undefined)) {
      agg.coreMet += 1;
    }
    map.set(key, agg);
  }

  return NextResponse.json({ items: Array.from(map.values()), start, end });
}
