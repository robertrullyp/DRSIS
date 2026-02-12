import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { operationalTransferSchema } from "@/lib/schemas/finance";
import {
  assertFinancePeriodUnlocked,
  generateOperationalReferenceNo,
} from "@/server/finance/controls";
import { validateFinanceAccount } from "@/server/finance/operational";
import { writeFinanceAudit } from "@/server/finance/audit";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = operationalTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actor = token?.sub;
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const txnDate = parsed.data.txnDate ?? new Date();
      await assertFinancePeriodUnlocked(tx, txnDate);
      await validateFinanceAccount(tx, parsed.data.fromAccountId);
      await validateFinanceAccount(tx, parsed.data.toAccountId);
      const referenceNo =
        parsed.data.referenceNo ?? (await generateOperationalReferenceNo(tx, txnDate));

      const outTxn = await tx.operationalTxn.create({
        data: {
          txnDate,
          kind: "TRANSFER_OUT",
          amount: parsed.data.amount,
          description: parsed.data.description ?? null,
          referenceNo: `${referenceNo}-OUT`,
          proofUrl: parsed.data.proofUrl ?? null,
          accountId: parsed.data.fromAccountId,
          cashBankAccountId: parsed.data.fromCashBankAccountId,
          createdBy: actor,
          approvalStatus: "PENDING",
        },
      });

      const inTxn = await tx.operationalTxn.create({
        data: {
          txnDate,
          kind: "TRANSFER_IN",
          amount: parsed.data.amount,
          description: parsed.data.description ?? null,
          referenceNo: `${referenceNo}-IN`,
          proofUrl: parsed.data.proofUrl ?? null,
          accountId: parsed.data.toAccountId,
          cashBankAccountId: parsed.data.toCashBankAccountId,
          transferPairId: outTxn.id,
          createdBy: actor,
          approvalStatus: "PENDING",
        },
      });

      const syncedOut = await tx.operationalTxn.update({
        where: { id: outTxn.id },
        data: { transferPairId: inTxn.id },
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
          cashBankAccount: {
            select: { id: true, code: true, name: true, type: true, balance: true },
          },
          transferPair: { select: { id: true, kind: true, amount: true } },
        },
      });

      const syncedIn = await tx.operationalTxn.findUnique({
        where: { id: inTxn.id },
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
          cashBankAccount: {
            select: { id: true, code: true, name: true, type: true, balance: true },
          },
          transferPair: { select: { id: true, kind: true, amount: true } },
        },
      });

      await writeFinanceAudit(tx, {
        actorId: actor,
        type: "finance.operational.transfer.created",
        entity: "OperationalTxn",
        entityId: outTxn.id,
        meta: {
          outTxnId: outTxn.id,
          inTxnId: inTxn.id,
          amount: parsed.data.amount,
          fromCashBankAccountId: parsed.data.fromCashBankAccountId,
          toCashBankAccountId: parsed.data.toCashBankAccountId,
          referenceNo,
        },
      });

      return {
        out: syncedOut,
        in: syncedIn,
      };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transfer failed" },
      { status: 400 }
    );
  }
}
