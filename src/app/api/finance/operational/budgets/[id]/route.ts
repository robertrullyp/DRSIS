import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { financeBudgetUpdateSchema } from "@/lib/schemas/finance";
import { validateFinanceAccount } from "@/server/finance/operational";
import { writeFinanceAudit } from "@/server/finance/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.financeBudget.findUnique({
    where: { id },
    include: {
      account: { select: { id: true, code: true, name: true, type: true } },
      cashBankAccount: { select: { id: true, code: true, name: true, type: true } },
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
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actor = token?.sub;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = financeBudgetUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.financeBudget.findUnique({
        where: { id },
        select: {
          id: true,
          periodStart: true,
          periodEnd: true,
          kind: true,
          amount: true,
          notes: true,
          accountId: true,
          cashBankAccountId: true,
        },
      });
      if (!current) throw new Error("not found");

      if (parsed.data.accountId) {
        await validateFinanceAccount(tx, parsed.data.accountId);
      }

      let cashBankId: string | null | undefined = undefined;
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

      const row = await tx.financeBudget.update({
        where: { id },
        data: {
          periodStart: parsed.data.periodStart,
          periodEnd: parsed.data.periodEnd,
          kind: parsed.data.kind,
          amount: parsed.data.amount,
          notes: typeof parsed.data.notes === "undefined" ? undefined : parsed.data.notes || null,
          accountId: parsed.data.accountId,
          cashBankAccountId: cashBankId,
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
        type: "finance.operational.budget.updated",
        entity: "FinanceBudget",
        entityId: id,
        meta: {
          before: {
            periodStart: current.periodStart.toISOString(),
            periodEnd: current.periodEnd.toISOString(),
            kind: current.kind,
            amount: current.amount,
            notes: current.notes,
            accountId: current.accountId,
            cashBankAccountId: current.cashBankAccountId,
          },
          after: {
            periodStart: row.periodStart.toISOString(),
            periodEnd: row.periodEnd.toISOString(),
            kind: row.kind,
            amount: row.amount,
            notes: row.notes,
            accountId: row.accountId,
            cashBankAccountId: row.cashBankAccountId,
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
      { error: error instanceof Error ? error.message : "Failed to update budget" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const actor = token?.sub;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.financeBudget.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.financeBudget.delete({ where: { id } });
    await writeFinanceAudit(tx, {
      actorId: actor,
      type: "finance.operational.budget.deleted",
      entity: "FinanceBudget",
      entityId: id,
      meta: {
        kind: existing.kind,
        amount: existing.amount,
        accountId: existing.accountId,
        cashBankAccountId: existing.cashBankAccountId,
        periodStart: existing.periodStart.toISOString(),
        periodEnd: existing.periodEnd.toISOString(),
      },
    });
  });

  return NextResponse.json({ ok: true });
}

