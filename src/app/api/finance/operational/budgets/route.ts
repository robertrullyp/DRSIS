import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import {
  financeBudgetCreateSchema,
} from "@/lib/schemas/finance";
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
  const startStr = req.nextUrl.searchParams.get("start");
  const endStr = req.nextUrl.searchParams.get("end");
  const kind = req.nextUrl.searchParams.get("kind") || undefined;
  const accountId = req.nextUrl.searchParams.get("accountId") || undefined;
  const cashBankAccountId =
    req.nextUrl.searchParams.get("cashBankAccountId") || undefined;

  const where: Record<string, unknown> = {};
  if (kind) where.kind = kind;
  if (accountId) where.accountId = accountId;
  if (cashBankAccountId) where.cashBankAccountId = cashBankAccountId;
  if (startStr && endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      where.AND = [
        { periodStart: { lte: end } },
        { periodEnd: { gte: start } },
      ];
    }
  }

  const [items, total] = await Promise.all([
    prisma.financeBudget.findMany({
      where,
      include: {
        account: { select: { id: true, code: true, name: true, type: true } },
        cashBankAccount: {
          select: { id: true, code: true, name: true, type: true },
        },
      },
      orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.financeBudget.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actor = token?.sub;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = financeBudgetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      await validateFinanceAccount(tx, parsed.data.accountId);

      let cashBankId: string | null = null;
      if (typeof parsed.data.cashBankAccountId !== "undefined") {
        cashBankId = parsed.data.cashBankAccountId || null;
      }
      if (cashBankId) {
        const acc = await tx.cashBankAccount.findUnique({
          where: { id: cashBankId },
          select: { id: true, isActive: true },
        });
        if (!acc) throw new Error("Cash/bank account not found");
        if (!acc.isActive) throw new Error("Cash/bank account is inactive");
      }

      const row = await tx.financeBudget.create({
        data: {
          periodStart: parsed.data.periodStart,
          periodEnd: parsed.data.periodEnd,
          kind: parsed.data.kind,
          amount: parsed.data.amount,
          notes: parsed.data.notes ?? null,
          accountId: parsed.data.accountId,
          cashBankAccountId: cashBankId,
          createdBy: actor,
        },
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
          cashBankAccount: {
            select: { id: true, code: true, name: true, type: true },
          },
        },
      });

      await writeFinanceAudit(tx, {
        actorId: actor,
        type: "finance.operational.budget.created",
        entity: "FinanceBudget",
        entityId: row.id,
        meta: {
          kind: row.kind,
          amount: row.amount,
          accountId: row.accountId,
          cashBankAccountId: row.cashBankAccountId,
          periodStart: row.periodStart.toISOString(),
          periodEnd: row.periodEnd.toISOString(),
        },
      });

      return row;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create budget" },
      { status: 400 }
    );
  }
}

