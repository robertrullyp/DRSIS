import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { studentAttendanceBulkSchema } from "@/lib/schemas/attendance";

function parseDateOnly(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  // Normalize to YYYY-MM-DD in UTC string
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get("classId");
  const dateStr = req.nextUrl.searchParams.get("date");
  if (!classId || !dateStr) {
    return NextResponse.json({ error: "classId and date required" }, { status: 400 });
  }
  const date = parseDateOnly(dateStr);
  if (!date) return NextResponse.json({ error: "invalid date" }, { status: 400 });

  const [enrolls, attns] = await Promise.all([
    prisma.enrollment.findMany({ where: { classroomId: classId, active: true }, include: { student: { include: { user: true } } }, orderBy: { enrolledAt: "asc" } }),
    prisma.studentAttendance.findMany({ where: { classroomId: classId, date } }),
  ]);

  const attnMap = new Map(attns.map((a) => [a.studentId, a] as const));
  const items = enrolls.map((e) => ({
    studentId: e.studentId,
    studentName: e.student.user?.name ?? "",
    status: attnMap.get(e.studentId)?.status ?? null,
    notes: attnMap.get(e.studentId)?.notes ?? null,
  }));
  const summary = {
    PRESENT: items.filter((x) => x.status === "PRESENT").length,
    EXCUSED: items.filter((x) => x.status === "EXCUSED").length,
    SICK: items.filter((x) => x.status === "SICK").length,
    ABSENT: items.filter((x) => x.status === "ABSENT").length,
    LATE: items.filter((x) => x.status === "LATE").length,
  };
  return NextResponse.json({ items, summary });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = studentAttendanceBulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { items } = parsed.data;

  for (const it of items) {
    const existing = await prisma.studentAttendance.findFirst({
      where: { studentId: it.studentId, classroomId: it.classroomId, date: it.date },
    });
    if (existing) {
      await prisma.studentAttendance.update({ where: { id: existing.id }, data: { status: it.status, notes: it.notes ?? null } });
    } else {
      await prisma.studentAttendance.create({ data: { studentId: it.studentId, classroomId: it.classroomId, date: it.date, status: it.status, notes: it.notes ?? null } });
    }
  }

  return NextResponse.json({ ok: true });
}

