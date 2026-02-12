import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { assertFinancePeriodUnlocked } from "@/server/finance/controls";
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
        throw new Error("Only pending transactions can be checked");
      }
      if (group.some((txn) => txn.checkedBy)) {
        throw new Error("Transaction already checked");
      }
      if (group.some((txn) => txn.createdBy && txn.createdBy === actor)) {
        throw new Error("Maker cannot check their own transaction");
      }

      for (const txn of group) {
        await assertFinancePeriodUnlocked(tx, txn.txnDate);
      }

      const checkedAt = new Date();
      await tx.operationalTxn.updateMany({
        where: { id: { in: group.map((txn) => txn.id) } },
        data: { checkedBy: actor, checkedAt },
      });

      await writeFinanceAudit(tx, {
        actorId: actor,
        type: "finance.operational.txn.checked",
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
      { error: error instanceof Error ? error.message : "Check failed" },
      { status: 400 }
    );
  }
}
