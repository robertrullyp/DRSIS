import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { studentGuardianCreateSchema } from "@/lib/schemas/master";

const guardianRoles = ["parent", "guardian"] as const;

async function resolveGuardianUser(guardianUserId?: string, guardianEmail?: string) {
  if (guardianUserId) {
    return prisma.user.findUnique({
      where: { id: guardianUserId },
      include: { role: true },
    });
  }

  if (guardianEmail) {
    return prisma.user.findUnique({
      where: { email: guardianEmail },
      include: { role: true },
    });
  }

  return null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const items = await prisma.studentGuardian.findMany({
    where: { studentId },
    include: {
      guardianUser: {
        include: {
          role: true,
        },
      },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params;
  const body = await req.json();
  const parsed = studentGuardianCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const guardianUser = await resolveGuardianUser(parsed.data.guardianUserId, parsed.data.guardianEmail);
  if (!guardianUser) return NextResponse.json({ error: "Guardian user not found" }, { status: 404 });

  const roleName = guardianUser.role?.name ?? "";
  if (!guardianRoles.includes(roleName as (typeof guardianRoles)[number])) {
    return NextResponse.json({
      error: `User role must be one of: ${guardianRoles.join(", ")}`,
    }, { status: 400 });
  }

  const relation = parsed.data.relation ?? "GUARDIAN";
  const isPrimary = parsed.data.isPrimary ?? false;

  const updated = await prisma.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.studentGuardian.updateMany({
        where: { studentId },
        data: { isPrimary: false },
      });
    }

    return tx.studentGuardian.upsert({
      where: {
        studentId_guardianUserId: {
          studentId,
          guardianUserId: guardianUser.id,
        },
      },
      create: {
        studentId,
        guardianUserId: guardianUser.id,
        relation,
        isPrimary,
      },
      update: {
        relation,
        isPrimary,
      },
      include: {
        guardianUser: {
          include: {
            role: true,
          },
        },
      },
    });
  });

  return NextResponse.json(updated, { status: 201 });
}
