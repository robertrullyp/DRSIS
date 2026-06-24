import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { resolvePortalStudentContext } from "@/server/portal/student-context";
import { listPortalInboxNotifications } from "@/server/notifications/inbox";
import { portalNotificationQuerySchema } from "@/server/notifications/notification.dto";

function dateOnlyUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ items: [] });

  const parsed = portalNotificationQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const requestedStudentId = parsed.data.childId;
  const { studentId } = await resolvePortalStudentContext(userId, requestedStudentId);
  const items: Array<{ id: string; source: "generated"; type: string; title: string; description?: string; href?: string; date?: Date; severity?: "info" | "warning" | "danger" }> = [];
  const today = dateOnlyUTC(new Date());

  if (studentId) {
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
        source: "generated",
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
        items.push({ id: `attn-${attn.id}`, source: "generated", type: "attendance", title: `Status presensi hari ini: ${map[attn.status] || attn.status}`, description: attn.notes ?? undefined, href: "/portal/student/attendance", date: attn.date, severity: attn.status === "ABSENT" ? "danger" : "warning" });
      }
    }

    // Recent report cards (last 14 days)
    const fourteenAgo = new Date();
    fourteenAgo.setDate(fourteenAgo.getDate() - 14);
    const rcs = await prisma.reportCard.findMany({ where: { studentId, createdAt: { gte: fourteenAgo } }, orderBy: { createdAt: "desc" }, take: 5, include: { semester: true, classroom: true } });
    for (const rc of rcs) {
      items.push({ id: `rc-${rc.id}`, source: "generated", type: "report", title: `Raport tersedia: ${rc.classroom.name} - ${rc.semester.name}`, href: "/portal/student/report-cards", date: rc.createdAt, severity: "info" });
    }
  }

  const inboxItems = await listPortalInboxNotifications({
    userId,
    studentId,
    includeArchived: parsed.data.includeArchived,
  });
  const mergedItems = [...inboxItems, ...items]
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .slice(0, 80);

  return NextResponse.json({ items: mergedItems });
}
