import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { writeAuditEvent } from "@/server/audit";
import type {
  NotificationAdminListQueryInput,
  NotificationCreateInput,
  PortalNotificationUpdateInput,
} from "./notification.dto";

export type PortalNotificationItem = {
  id: string;
  source: "inbox" | "generated";
  type: string;
  title: string;
  description?: string;
  href?: string;
  date?: Date;
  severity?: "info" | "warning" | "danger";
  status?: "UNREAD" | "READ" | "ARCHIVED";
  readAt?: Date | null;
};

function severityToPortal(severity: "INFO" | "WARNING" | "DANGER") {
  if (severity === "DANGER") return "danger";
  if (severity === "WARNING") return "warning";
  return "info";
}

function safeWhereText(q: string): Prisma.NotificationInboxWhereInput {
  return {
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { type: { contains: q, mode: "insensitive" } },
    ],
  };
}

export async function listAdminNotifications(query: NotificationAdminListQueryInput) {
  const { page, pageSize, q, status, severity, recipientUserId, studentId, type } = query;
  const where: Prisma.NotificationInboxWhereInput = {
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(recipientUserId ? { recipientUserId } : {}),
    ...(studentId ? { studentId } : {}),
    ...(type ? { type } : {}),
    ...(q ? safeWhereText(q) : {}),
  };

  const [items, total] = await Promise.all([
    prisma.notificationInbox.findMany({
      where,
      include: {
        recipient: { select: { id: true, email: true, name: true } },
        student: { select: { id: true, nis: true, user: { select: { name: true } } } },
      },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notificationInbox.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function createNotification(input: NotificationCreateInput, actorId: string) {
  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.notificationInbox.create({
      data: {
        recipientUserId: input.recipientUserId,
        studentId: input.studentId ?? null,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        severity: input.severity,
        createdById: actorId,
      },
    });

    await writeAuditEvent(tx, {
      actorId,
      type: "notification.inbox.create",
      entity: "NotificationInbox",
      entityId: item.id,
      meta: { recipientUserId: input.recipientUserId, studentId: input.studentId ?? null, type: input.type },
    });

    return item;
  });

  return created;
}

export async function listPortalInboxNotifications(input: {
  userId: string;
  studentId: string | null;
  includeArchived?: boolean;
}): Promise<PortalNotificationItem[]> {
  const where: Prisma.NotificationInboxWhereInput = {
    recipientUserId: input.userId,
    ...(input.includeArchived ? {} : { status: { not: "ARCHIVED" } }),
    OR: [{ studentId: null }, ...(input.studentId ? [{ studentId: input.studentId }] : [])],
  };

  const rows = await prisma.notificationInbox.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 50,
  });

  return rows.map((row) => ({
    id: row.id,
    source: "inbox",
    type: row.type,
    title: row.title,
    description: row.body ?? undefined,
    href: row.href ?? undefined,
    date: row.createdAt,
    severity: severityToPortal(row.severity),
    status: row.status,
    readAt: row.readAt,
  }));
}

export async function updatePortalNotification(
  id: string,
  userId: string,
  input: PortalNotificationUpdateInput,
) {
  const existing = await prisma.notificationInbox.findFirst({
    where: { id, recipientUserId: userId },
  });
  if (!existing) return null;

  return prisma.notificationInbox.update({
    where: { id },
    data: {
      status: input.status,
      readAt: input.status === "READ" ? existing.readAt ?? new Date() : existing.readAt,
    },
  });
}
