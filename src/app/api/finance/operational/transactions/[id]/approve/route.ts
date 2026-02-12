import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { assertFinancePeriodUnlocked } from "@/server/finance/controls";
import { applyCashBankBalance } from "@/server/finance/operational";
import { writeFinanceAudit } from "@/server/finance/audit";
import { loadApprovalGroup } from "@/server/finance/operational-approval";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actor = token?.sub;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const group = await loadApprovalGroup(tx, id);
      if (group.some((txn) => txn.approvalStatus !== "PENDING")) {
        throw new Error("Only pending transactions can be approved");
      }
      if (group.some((txn) => !txn.checkedBy)) {
        throw new Error("Transaction must be checked before approval");
      }
      if (group.some((txn) => txn.createdBy && txn.createdBy === actor)) {
        throw new Error("Maker cannot approve their own transaction");
      }
      if (group.some((txn) => txn.checkedBy && txn.checkedBy === actor)) {
        throw new Error("Checker cannot approve the same transaction");
      }
      if (group.some((txn) => txn.approvedBy || txn.approvedAt)) {
        throw new Error("Transaction already approved");
      }

      for (const txn of group) {
        await assertFinancePeriodUnlocked(tx, txn.txnDate);
        await applyCashBankBalance(tx, {
          kind: txn.kind,
          amount: txn.amount,
          cashBankAccountId: txn.cashBankAccountId,
        });
      }

      const approvedAt = new Date();
      await tx.operationalTxn.updateMany({
        where: { id: { in: group.map((txn) => txn.id) } },
        data: {
          approvalStatus: "APPROVED",
          approvedBy: actor,
          approvedAt,
          rejectedBy: null,
          rejectedAt: null,
          rejectedReason: null,
        },
      });

      await writeFinanceAudit(tx, {
        actorId: actor,
        type: "finance.operational.txn.approved",
        entity: "OperationalTxn",
        entityId: id,
        meta: { txnIds: group.map((txn) => txn.id) },
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
      { error: error instanceof Error ? error.message : "Approve failed" },
      { status: 400 }
    );
  }
}
