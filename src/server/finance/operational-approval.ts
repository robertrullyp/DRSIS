import type { Prisma } from "@/generated/prisma";

export type ApprovalTargetTxn = {
  id: string;
  kind: "INCOME" | "EXPENSE" | "TRANSFER_IN" | "TRANSFER_OUT";
  amount: number;
  txnDate: Date;
  accountId: string;
  cashBankAccountId: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdBy: string | null;
  checkedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  transferPairId: string | null;
  referenceNo: string | null;
};

export async function loadApprovalGroup(
  tx: Prisma.TransactionClient,
  txnId: string
) {
  const base = await tx.operationalTxn.findUniqueOrThrow({
    where: { id: txnId },
    select: {
      id: true,
      kind: true,
      amount: true,
      txnDate: true,
      accountId: true,
      cashBankAccountId: true,
      approvalStatus: true,
      createdBy: true,
      checkedBy: true,
      approvedBy: true,
      approvedAt: true,
      transferPairId: true,
      referenceNo: true,
    },
  });

  let pair: ApprovalTargetTxn | null = null;
  if (base.transferPairId) {
    pair = await tx.operationalTxn.findUnique({
      where: { id: base.transferPairId },
      select: {
        id: true,
        kind: true,
        amount: true,
        txnDate: true,
        accountId: true,
        cashBankAccountId: true,
        approvalStatus: true,
        createdBy: true,
        checkedBy: true,
        approvedBy: true,
        approvedAt: true,
        transferPairId: true,
        referenceNo: true,
      },
    });
  }

  if (!pair) return [base] as ApprovalTargetTxn[];
  if (pair.id === base.id) return [base] as ApprovalTargetTxn[];
  return [base, pair];
}
