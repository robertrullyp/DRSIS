import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ppdbDecideSchema } from "@/lib/schemas/ppdb";
import { getToken } from "next-auth/jwt";
import { writeAuditEvent } from "@/server/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = ppdbDecideSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { decision, notes, autoEnroll } = parsed.data;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (decision === "REJECTED") {
    const decidedAt = new Date();
    const updated = await prisma.admissionApplication.update({ where: { id }, data: { status: "REJECTED", decisionAt: decidedAt, notes: notes ?? undefined } });
    await writeAuditEvent(prisma, {
      actorId,
      type: "ppdb.application.decide",
      entity: "AdmissionApplication",
      entityId: id,
      meta: { decision, autoEnroll: false, status: updated.status, decidedAt: decidedAt.toISOString() },
    });
    return NextResponse.json(updated);
  }

  // ACCEPTED (with optional auto-enroll)
  const app = await prisma.admissionApplication.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!autoEnroll) {
    const decidedAt = new Date();
    const updated = await prisma.admissionApplication.update({ where: { id }, data: { status: "ACCEPTED", decisionAt: decidedAt, notes: notes ?? undefined } });
    await writeAuditEvent(prisma, {
      actorId,
      type: "ppdb.application.decide",
      entity: "AdmissionApplication",
      entityId: id,
      meta: { decision, autoEnroll: false, status: updated.status, decidedAt: decidedAt.toISOString() },
    });
    return NextResponse.json(updated);
  }

  const result = await prisma.$transaction(async (tx) => {
    // find or create user
    let user = await tx.user.findUnique({ where: { email: app.email } });
    if (!user) {
      const studentRole = await tx.role.findUnique({ where: { name: "student" } });
      user = await tx.user.create({ data: { email: app.email, name: app.fullName, roleId: studentRole?.id ?? null } });
    }
    // create student if not exists
    let student = await tx.student.findFirst({ where: { userId: user.id } });
    if (!student) student = await tx.student.create({ data: { userId: user.id } });

    // try to enroll to any classroom in active AY matching gradeApplied
    let enrolled = false;
    if (app.gradeAppliedId) {
      const ay = await tx.academicYear.findFirst({ where: { isActive: true } });
      if (ay) {
        const klass = await tx.classroom.findFirst({ where: { academicYearId: ay.id, gradeId: app.gradeAppliedId } });
        if (klass) {
          await tx.enrollment.upsert({
            where: { studentId_academicYearId: { studentId: student.id, academicYearId: ay.id } },
            update: { classroomId: klass.id, active: true },
            create: { studentId: student.id, academicYearId: ay.id, classroomId: klass.id, active: true },
          });
          enrolled = true;
        }
      }
    }

    const updated = await tx.admissionApplication.update({
      where: { id },
      data: { status: enrolled ? "ENROLLED" : "ACCEPTED", decisionAt: new Date(), enrolledStudentId: student.id, notes: notes ?? undefined },
    });
    return updated;
  });

  await writeAuditEvent(prisma, {
    actorId,
    type: "ppdb.application.decide",
    entity: "AdmissionApplication",
    entityId: id,
    meta: {
      decision,
      autoEnroll: true,
      status: result.status,
      enrolledStudentId: result.enrolledStudentId,
      decidedAt: result.decisionAt?.toISOString() ?? null,
    },
  });

  return NextResponse.json(result);
}
