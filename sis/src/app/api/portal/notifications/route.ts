import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

function dateOnlyUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ items: [] });

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
  const items: Array<{ id: string; type: string; title: string; description?: string; href?: string; date?: Date; severity?: "info" | "warning" | "danger" }> = [];
  const today = dateOnlyUTC(new Date());

  if (user?.student) {
    const studentId = user.student.id;
    // Unpaid/overdue invoices (next 7 days or overdue)
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    const invoices = await prisma.invoice.findMany({
      where: {
        studentId,
        status: { in: ["OPEN", "PARTIAL", "DRAFT"] as any },
        OR: [
          { dueDate: { lte: soon } },
          { dueDate: null },
        ],
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    });
    for (const inv of invoices) {
      const overdue = inv.dueDate ? inv.dueDate < new Date() : false;
      items.push({
        id: `inv-${inv.id}`,
        type: "billing",
        title: overdue ? `Tagihan terlambat: ${inv.code}` : `Tagihan akan jatuh tempo: ${inv.code}`,
        description: inv.dueDate ? `Jatuh tempo ${inv.dueDate.toLocaleDateString()}` : "Segera lunasi",
        href: "/portal/student/billing",
        date: inv.dueDate ?? undefined,
        severity: overdue ? "danger" : "warning",
      });
    }

    // Today's attendance
    const attn = await prisma.studentAttendance.findFirst({ where: { studentId, date: today } });
    if (attn) {
      if (attn.status === "ABSENT" || attn.status === "LATE" || attn.status === "EXCUSED" || attn.status === "SICK") {
        const map: Record<string, string> = { ABSENT: "Alfa", LATE: "Terlambat", EXCUSED: "Izin", SICK: "Sakit" };
        items.push({ id: `attn-${attn.id}`, type: "attendance", title: `Status presensi hari ini: ${map[attn.status] || attn.status}`, description: attn.notes ?? undefined, href: "/portal/student/attendance", date: attn.date, severity: attn.status === "ABSENT" ? "danger" : "warning" });
      }
    }

    // Recent report cards (last 14 days)
    const fourteenAgo = new Date();
    fourteenAgo.setDate(fourteenAgo.getDate() - 14);
    const rcs = await prisma.reportCard.findMany({ where: { studentId, createdAt: { gte: fourteenAgo } }, orderBy: { createdAt: "desc" }, take: 5, include: { semester: true, classroom: true } });
    for (const rc of rcs) {
      items.push({ id: `rc-${rc.id}`, type: "report", title: `Raport tersedia: ${rc.classroom.name} - ${rc.semester.name}`, href: "/portal/student/report-cards", date: rc.createdAt, severity: "info" });
    }
  }

  return NextResponse.json({ items });
}

