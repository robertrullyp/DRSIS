import type { Prisma } from "@/generated/prisma";

type FinanceAuditInput = {
  actorId?: string | null;
  type: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
};

function safeMeta(meta: Record<string, unknown> | undefined) {
  if (!meta) return null;
  try {
    return JSON.stringify(meta);
  } catch {
    return null;
  }
}

export async function writeFinanceAudit(
  tx: Prisma.TransactionClient,
  input: FinanceAuditInput
) {
  await tx.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      type: input.type,
      entity: input.entity ?? null,
      entityId: input.entityId ?? null,
      meta: safeMeta(input.meta),
      occurredAt: new Date(),
    },
  });
}
