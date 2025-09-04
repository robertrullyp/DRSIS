import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type BulkBody = {
  academicYearId: string;
  classroomId?: string;
  gradeId?: string;
  feeRuleIds?: string[];
  dueDate?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as BulkBody;
  const { academicYearId, classroomId, gradeId, feeRuleIds, dueDate } = body;
  if (!academicYearId) return NextResponse.json({ error: "academicYearId required" }, { status: 400 });

  // Select students by classroom or grade for the given AY
  let enrolls = await prisma.enrollment.findMany({
    where: {
      academicYearId,
      active: true,
      ...(classroomId ? { classroomId } : {}),
    },
    include: { student: { include: { user: true } }, classroom: { include: { grade: true } } },
  });
  if (!classroomId && gradeId) {
    enrolls = enrolls.filter((e) => e.classroom?.gradeId === gradeId);
  }
  if (!enrolls.length) return NextResponse.json({ error: "no enrollments" }, { status: 400 });

  // Get applicable fee rules: selected by ids or global + by grade
  let feeRules = [] as { id: string; name: string; amount: number; gradeId: string | null }[];
  if (feeRuleIds?.length) {
    feeRules = await prisma.feeRule.findMany({ where: { id: { in: feeRuleIds } } });
  } else {
    // global (gradeId null) and grade-specific (if filtering by grade) else per enroll grade
    const globals = await prisma.feeRule.findMany({ where: { gradeId: null } });
    if (gradeId) {
      const gradeSpecific = await prisma.feeRule.findMany({ where: { gradeId } });
      feeRules = [...globals, ...gradeSpecific];
    } else {
      feeRules = globals;
    }
  }
  if (!feeRules.length) return NextResponse.json({ error: "no fee rules" }, { status: 400 });

  const codePrefix = `BULK-${Date.now()}`;
  const invoices = await prisma.$transaction(async (tx) => {
    const created: string[] = [];
    for (const e of enrolls) {
      // If no grade filter and fee rules include grade-specific, include those matching the enrollment grade
      const rules = gradeId
        ? feeRules
        : (
            feeRules.filter((r) => !r.gradeId || r.gradeId === e.classroom?.gradeId)
          );
      const total = rules.reduce((a, r) => a + (r.amount || 0), 0);
      const inv = await tx.invoice.create({
        data: {
          code: `${codePrefix}-${e.studentId.slice(0, 6)}`,
          studentId: e.studentId,
          academicYearId,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: "OPEN",
          total,
        },
      });
      await tx.invoiceItem.createMany({ data: rules.map((r) => ({ invoiceId: inv.id, name: r.name, amount: r.amount })) });
      created.push(inv.id);
    }
    return created;
  });

  return NextResponse.json({ ok: true, count: invoices.length });
}

