import { Prisma } from "@/generated/prisma";

type ApplyTxnInput = {
  kind: "INCOME" | "EXPENSE" | "TRANSFER_IN" | "TRANSFER_OUT";
  amount: number;
  cashBankAccountId: string;
};

export function computeBalanceDelta(kind: ApplyTxnInput["kind"], amount: number) {
  if (kind === "EXPENSE" || kind === "TRANSFER_OUT") return -Math.abs(amount);
  return Math.abs(amount);
}

export async function applyCashBankBalance(
  tx: Prisma.TransactionClient,
  input: ApplyTxnInput
) {
  const account = await tx.cashBankAccount.findUniqueOrThrow({
    where: { id: input.cashBankAccountId },
    select: { id: true, balance: true, isActive: true },
  });
  if (!account.isActive) throw new Error("Cash/bank account is inactive");

  const delta = computeBalanceDelta(input.kind, input.amount);
  const nextBalance = account.balance + delta;
  if (nextBalance < 0) {
    throw new Error("Insufficient balance");
  }
  await tx.cashBankAccount.update({
    where: { id: account.id },
    data: { balance: nextBalance },
  });
  return nextBalance;
}

export async function validateFinanceAccount(
  tx: Prisma.TransactionClient,
  accountId: string
) {
  const account = await tx.financeAccount.findUnique({
    where: { id: accountId },
    select: { id: true, isActive: true },
  });
  if (!account) throw new Error("Finance account not found");
  if (!account.isActive) throw new Error("Finance account is inactive");
  return account;
}
