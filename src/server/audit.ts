import type { Prisma } from "@/generated/prisma";

export type AuditWriteClient = Pick<Prisma.TransactionClient, "auditEvent">;

export type AuditEventInput = {
  actorId?: string | null;
  type: string;
  entity?: string | null;
  entityId?: string | null;
  meta?: Record<string, unknown> | null;
  occurredAt?: Date;
};

function safeMeta(meta: Record<string, unknown> | null | undefined) {
  if (!meta) return null;
  try {
    return JSON.stringify(meta);
  } catch {
    return null;
  }
}

export async function writeAuditEvent(client: AuditWriteClient, input: AuditEventInput) {
  await client.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      type: input.type,
      entity: input.entity ?? null,
      entityId: input.entityId ?? null,
      meta: safeMeta(input.meta),
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

