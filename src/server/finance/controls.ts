import type { Prisma } from "@/generated/prisma";

export async function isFinancePeriodLocked(
  tx: Prisma.TransactionClient,
  date: Date
) {
  const lock = await tx.financePeriodLock.findFirst({
    where: {
      startDate: { lte: date },
      endDate: { gte: date },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      reason: true,
    },
  });
  return lock;
}

export async function assertFinancePeriodUnlocked(
  tx: Prisma.TransactionClient,
  date: Date
) {
  const lock = await isFinancePeriodLocked(tx, date);
  if (lock) {
    const start = lock.startDate.toISOString().slice(0, 10);
    const end = lock.endDate.toISOString().slice(0, 10);
    throw new Error(
      `Financial period ${start}..${end} is locked${
        lock.reason ? ` (${lock.reason})` : ""
      }`
    );
  }
}

export async function generateOperationalReferenceNo(
  tx: Prisma.TransactionClient,
  txnDate: Date
) {
  const y = txnDate.getFullYear();
  const m = String(txnDate.getMonth() + 1).padStart(2, "0");
  const d = String(txnDate.getDate()).padStart(2, "0");
  const dateToken = `${y}${m}${d}`;

  const start = new Date(txnDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(txnDate);
  end.setHours(23, 59, 59, 999);

  const count = await tx.operationalTxn.count({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      referenceNo: {
        startsWith: `OPR-${dateToken}-`,
      },
    },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `OPR-${dateToken}-${seq}`;
}
