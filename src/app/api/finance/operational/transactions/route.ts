import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { operationalTxnCreateSchema } from "@/lib/schemas/finance";
import {
  assertFinancePeriodUnlocked,
  generateOperationalReferenceNo,
} from "@/server/finance/controls";
import { validateFinanceAccount } from "@/server/finance/operational";
import { writeFinanceAudit } from "@/server/finance/audit";

export async function GET(req: NextRequest) {
  const parsed = paginationSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { page, pageSize } = parsed.data;
  const kind = req.nextUrl.searchParams.get("kind") || undefined;
  const accountId = req.nextUrl.searchParams.get("accountId") || undefined;
  const cashBankAccountId =
    req.nextUrl.searchParams.get("cashBankAccountId") || undefined;
  const approvalStatus =
    req.nextUrl.searchParams.get("approvalStatus") || undefined;
  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");

  const where: Record<string, unknown> = {};
  if (kind) where.kind = kind;
  if (accountId) where.accountId = accountId;
  if (cashBankAccountId) where.cashBankAccountId = cashBankAccountId;
  if (approvalStatus) where.approvalStatus = approvalStatus;
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (
      !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(endDate.getTime())
    ) {
      where.txnDate = {
        gte: startDate,
        lte: endDate,
      };
    }
  }

  const [items, total] = await Promise.all([
    prisma.operationalTxn.findMany({
      where,
      include: {
        account: { select: { id: true, code: true, name: true, type: true } },
        cashBankAccount: {
          select: { id: true, code: true, name: true, type: true, balance: true },
        },
        transferPair: { select: { id: true, kind: true } },
      },
      orderBy: [{ txnDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.operationalTxn.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = operationalTxnCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actor = token?.sub;
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const txnDate = parsed.data.txnDate ?? new Date();
      await assertFinancePeriodUnlocked(tx, txnDate);
      await validateFinanceAccount(tx, parsed.data.accountId);
      const referenceNo =
        parsed.data.referenceNo ?? (await generateOperationalReferenceNo(tx, txnDate));
      const row = await tx.operationalTxn.create({
        data: {
          txnDate,
          kind: parsed.data.kind,
          amount: parsed.data.amount,
          description: parsed.data.description ?? null,
          referenceNo,
          proofUrl: parsed.data.proofUrl ?? null,
          accountId: parsed.data.accountId,
          cashBankAccountId: parsed.data.cashBankAccountId,
          createdBy: actor,
          approvalStatus: "PENDING",
        },
      });
      await writeFinanceAudit(tx, {
        actorId: actor,
        type: "finance.operational.txn.created",
        entity: "OperationalTxn",
        entityId: row.id,
        meta: {
          kind: row.kind,
          amount: row.amount,
          accountId: row.accountId,
          cashBankAccountId: row.cashBankAccountId,
          referenceNo: row.referenceNo,
        },
      });
      return tx.operationalTxn.findUnique({
        where: { id: row.id },
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
          cashBankAccount: {
            select: { id: true, code: true, name: true, type: true, balance: true },
          },
          transferPair: { select: { id: true, kind: true } },
        },
      });
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create transaction" },
      { status: 400 }
    );
  }
}
