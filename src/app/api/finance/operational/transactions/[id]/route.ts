import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { assertFinancePeriodUnlocked } from "@/server/finance/controls";
import { writeFinanceAudit } from "@/server/finance/audit";

const txnMetaUpdateSchema = z.object({
  txnDate: z.coerce.date().optional(),
  description: z.string().max(1000).optional().nullable(),
  referenceNo: z.string().max(100).optional().nullable(),
  proofUrl: z.string().url().max(2000).optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.operationalTxn.findUnique({
    where: { id },
    include: {
      account: { select: { id: true, code: true, name: true, type: true } },
      cashBankAccount: {
        select: { id: true, code: true, name: true, type: true, balance: true },
      },
      transferPair: { select: { id: true, kind: true, amount: true } },
      pairedWith: { select: { id: true, kind: true, amount: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = txnMetaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as { sub?: string; roles?: string[]; permissions?: string[] } | null;
  const actor = token?.sub;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roles = Array.isArray(token?.roles) ? token.roles : [];
  const permissions = Array.isArray(token?.permissions) ? token.permissions : [];
  const hasElevatedAccess =
    roles.includes("admin") ||
    roles.includes("finance") ||
    permissions.includes("finance.manage");

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.operationalTxn.findUnique({
        where: { id },
        select: {
          id: true,
          txnDate: true,
          description: true,
          referenceNo: true,
          proofUrl: true,
          approvalStatus: true,
          createdBy: true,
        },
      });
      if (!current) throw new Error("not found");
      if (current.approvalStatus !== "PENDING") {
        throw new Error("Only pending transactions can be edited");
      }
      if (current.createdBy && current.createdBy !== actor && !hasElevatedAccess) {
        throw new Error("Only maker or finance admin can edit this transaction");
      }

      await assertFinancePeriodUnlocked(tx, current.txnDate);
      const nextTxnDate = parsed.data.txnDate ?? current.txnDate;
      if (nextTxnDate.getTime() !== current.txnDate.getTime()) {
        await assertFinancePeriodUnlocked(tx, nextTxnDate);
      }

      const row = await tx.operationalTxn.update({
        where: { id },
        data: {
          txnDate: parsed.data.txnDate,
          description:
            typeof parsed.data.description === "undefined"
              ? undefined
              : parsed.data.description || null,
          referenceNo:
            typeof parsed.data.referenceNo === "undefined"
              ? undefined
              : parsed.data.referenceNo || null,
          proofUrl:
            typeof parsed.data.proofUrl === "undefined"
              ? undefined
              : parsed.data.proofUrl || null,
        },
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
          cashBankAccount: {
            select: { id: true, code: true, name: true, type: true, balance: true },
          },
        },
      });

      await writeFinanceAudit(tx, {
        actorId: actor,
        type: "finance.operational.txn.updated",
        entity: "OperationalTxn",
        entityId: id,
        meta: {
          before: {
            txnDate: current.txnDate.toISOString(),
            description: current.description,
            referenceNo: current.referenceNo,
            proofUrl: current.proofUrl,
          },
          after: {
            txnDate: row.txnDate.toISOString(),
            description: row.description,
            referenceNo: row.referenceNo,
            proofUrl: row.proofUrl,
          },
        },
      });

      return row;
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "not found") {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update transaction" },
      { status: 400 }
    );
  }
}
