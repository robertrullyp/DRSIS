import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { operationalTxnRejectSchema } from "@/lib/schemas/finance";
import { assertFinancePeriodUnlocked } from "@/server/finance/controls";
import { writeFinanceAudit } from "@/server/finance/audit";
import { loadApprovalGroup } from "@/server/finance/operational-approval";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = operationalTxnRejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actor = token?.sub;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const group = await loadApprovalGroup(tx, id);
      if (group.some((txn) => txn.approvalStatus !== "PENDING")) {
        throw new Error("Only pending transactions can be rejected");
      }
      if (group.some((txn) => txn.createdBy && txn.createdBy === actor)) {
        throw new Error("Maker cannot reject their own transaction");
      }

      for (const txn of group) {
        await assertFinancePeriodUnlocked(tx, txn.txnDate);
      }

      const rejectedAt = new Date();
      await tx.operationalTxn.updateMany({
        where: { id: { in: group.map((txn) => txn.id) } },
        data: {
          approvalStatus: "REJECTED",
          rejectedBy: actor,
          rejectedAt,
          rejectedReason: parsed.data.reason,
          approvedBy: null,
          approvedAt: null,
        },
      });

      await writeFinanceAudit(tx, {
        actorId: actor,
        type: "finance.operational.txn.rejected",
        entity: "OperationalTxn",
        entityId: id,
        meta: {
          txnIds: group.map((txn) => txn.id),
          reason: parsed.data.reason,
        },
      });

      return tx.operationalTxn.findMany({
        where: { id: { in: group.map((txn) => txn.id) } },
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
          cashBankAccount: {
            select: { id: true, code: true, name: true, type: true, balance: true },
          },
        },
      });
    });

    return NextResponse.json({ items: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reject failed" },
      { status: 400 }
    );
  }
}
