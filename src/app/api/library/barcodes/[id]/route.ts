import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { writeAuditEvent } from "@/server/audit";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await prisma.libBarcode.findUnique({ where: { id } });
  await prisma.libBarcode.delete({ where: { id } });
  await writeAuditEvent(prisma, {
    actorId,
    type: "library.barcode.delete",
    entity: "LibBarcode",
    entityId: id,
    meta: existing ? { itemId: existing.itemId, barcode: existing.barcode } : null,
  });
  return NextResponse.json({ ok: true });
}
