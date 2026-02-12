import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ppdbApplicationCreateSchema } from "@/lib/schemas/ppdb";
import { writeAuditEvent } from "@/server/audit";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ppdbApplicationCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const created = await prisma.admissionApplication.create({ data: parsed.data });
  await writeAuditEvent(prisma, {
    actorId: null,
    type: "ppdb.application.submit",
    entity: "AdmissionApplication",
    entityId: created.id,
    meta: { source: "public", status: created.status, gradeAppliedId: created.gradeAppliedId },
  });
  return NextResponse.json(created, { status: 201 });
}
