import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    orderBy: [{ date: "asc" }],
  });
  const header = ["Date", "Employee", "Shift", "Status", "CheckIn", "CheckOut", "Notes"].join(",");
  const lines = rows.map((r) => [
    r.date.toISOString().slice(0, 10),
    JSON.stringify(r.employee.user?.name ?? r.employeeId),
    JSON.stringify(r.shift?.name ?? "-"),
    r.status,
    r.checkInAt ? new Date(r.checkInAt).toISOString() : "",
    r.checkOutAt ? new Date(r.checkOutAt).toISOString() : "",
    JSON.stringify(r.notes ?? ""),
  ].join(","));
  const csv = [header, ...lines].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=attendance_${startStr}_to_${endStr}.csv` } });
}

