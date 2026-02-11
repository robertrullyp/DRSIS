import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extraAttendanceBulkSchema } from "@/lib/schemas/extras";

function dateOnlyUTC(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dateStr = req.nextUrl.searchParams.get("date");
  if (!dateStr) return NextResponse.json({ error: "date required" }, { status: 400 });
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "invalid date" }, { status: 400 });
  const date = dateOnlyUTC(d);
  const [members, attns] = await Promise.all([
    prisma.extraMember.findMany({ where: { extracurricularId: id }, include: { student: { include: { user: true } } }, orderBy: { joinedAt: "asc" } }),
    prisma.extraAttendance.findMany({ where: { extracurricularId: id, date } }),
  ]);
  const amap = new Map(attns.map((a) => [a.studentId, a] as const));
  const items = members.map((m) => ({ studentId: m.studentId, studentName: m.student.user?.name ?? "", status: amap.get(m.studentId)?.status ?? null }));
  const summary = {
    PRESENT: items.filter((x) => x.status === "PRESENT").length,
    EXCUSED: items.filter((x) => x.status === "EXCUSED").length,
    SICK: items.filter((x) => x.status === "SICK").length,
    ABSENT: items.filter((x) => x.status === "ABSENT").length,
    LATE: items.filter((x) => x.status === "LATE").length,
  };
  return NextResponse.json({ items, summary });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = extraAttendanceBulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { items } = parsed.data;
  for (const it of items) {
    const date = dateOnlyUTC(new Date(it.date));
    const existing = await prisma.extraAttendance.findFirst({ where: { extracurricularId: id, studentId: it.studentId, date } });
    if (existing) {
      await prisma.extraAttendance.update({ where: { id: existing.id }, data: { status: it.status } });
    } else {
      await prisma.extraAttendance.create({ data: { extracurricularId: id, studentId: it.studentId, date, status: it.status } });
    }
  }
  return NextResponse.json({ ok: true });
}

