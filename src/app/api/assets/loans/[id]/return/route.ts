import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { writeAuditEvent } from "@/server/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actorId = token?.sub as string | undefined;
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const updated = await prisma.assetLoan.update({ where: { id }, data: { returnedAt: new Date() } });
  await writeAuditEvent(prisma, {
    actorId,
    type: "asset.loan.return",
    entity: "AssetLoan",
    entityId: id,
    meta: { assetId: updated.assetId, borrowerUserId: updated.borrowerUserId, returnedAt: updated.returnedAt?.toISOString() ?? null },
  });
  return NextResponse.json(updated);
}
