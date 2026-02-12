import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { CmsContactCreateInput, CmsInboxExportQueryInput, CmsInboxListQueryInput, CmsInboxUpdateInput } from "@/server/cms/dto/contact.dto";
import { CmsServiceError } from "@/server/cms/page.service";
import { writeAuditEvent } from "@/server/audit";

type ContactMeta = {
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  source?: string | null;
};

const CMS_INBOX_EXPORT_MAX_ROWS = 5000;

function buildInboxWhere(query: {
  q?: string;
  isRead?: boolean;
  isResolved?: boolean;
}): Prisma.CmsContactMessageWhereInput {
  const where: Prisma.CmsContactMessageWhereInput = {};

  if (typeof query.isRead === "boolean") where.isRead = query.isRead;
  if (typeof query.isResolved === "boolean") where.isResolved = query.isResolved;
  if (query.q) {
    where.OR = [
      { name: { contains: query.q } },
      { email: { contains: query.q } },
      { phone: { contains: query.q } },
      { subject: { contains: query.q } },
      { message: { contains: query.q } },
    ];
  }

  return where;
}

function parseMeta(metaJson: string | null) {
  if (!metaJson) return null;
  try {
    const parsed = JSON.parse(metaJson);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function mapMessage(item: Prisma.CmsContactMessageGetPayload<Record<string, never>>) {
  return {
    ...item,
    meta: parseMeta(item.metaJson),
  };
}

function resolveContactEmailTarget() {
  return process.env.CMS_CONTACT_NOTIFY_EMAIL_TO || process.env.SEED_ADMIN_EMAIL || null;
}

function resolveContactWaTarget() {
  return process.env.CMS_CONTACT_NOTIFY_WA_TO || null;
}

function formatContactEmailHtml(input: CmsContactCreateInput, meta: ContactMeta) {
  const safe = (value?: string | null) => (value && value.length > 0 ? value : "-");
  return [
    "<h2>Pesan Kontak Baru</h2>",
    `<p><b>Nama:</b> ${safe(input.name)}</p>`,
    `<p><b>Email:</b> ${safe(input.email)}</p>`,
    `<p><b>Telepon:</b> ${safe(input.phone)}</p>`,
    `<p><b>Subjek:</b> ${safe(input.subject)}</p>`,
    `<p><b>Pesan:</b><br/>${safe(input.message).replace(/\n/g, "<br/>")}</p>`,
    `<p><b>IP:</b> ${safe(meta.ip)}</p>`,
    `<p><b>User Agent:</b> ${safe(meta.userAgent)}</p>`,
  ].join("\n");
}

function formatContactWaText(input: CmsContactCreateInput, meta: ContactMeta) {
  const safe = (value?: string | null) => (value && value.length > 0 ? value : "-");
  return [
    "[Kontak Baru]",
    `Nama: ${safe(input.name)}`,
    `Email: ${safe(input.email)}`,
    `Telepon: ${safe(input.phone)}`,
    `Subjek: ${safe(input.subject)}`,
    `Pesan: ${safe(input.message)}`,
    `IP: ${safe(meta.ip)}`,
  ].join("\n");
}

async function enqueueContactNotification(input: CmsContactCreateInput, meta: ContactMeta) {
  const emailTo = resolveContactEmailTarget();
  const waTo = resolveContactWaTarget();

  const jobs: Promise<unknown>[] = [];

  if (emailTo) {
    jobs.push(
      prisma.emailOutbox.create({
        data: {
          to: emailTo,
          subject: `[Kontak] ${input.subject || "Pesan baru dari website"}`,
          payload: JSON.stringify({
            html: formatContactEmailHtml(input, meta),
          }),
        },
      })
    );
  }

  if (waTo) {
    jobs.push(
      prisma.waOutbox.create({
        data: {
          to: waTo,
          payload: JSON.stringify({
            text: formatContactWaText(input, meta),
          }),
        },
      })
    );
  }

  if (jobs.length > 0) {
    await Promise.allSettled(jobs);
  }
}

export async function createCmsContactMessage(input: CmsContactCreateInput, meta: ContactMeta) {
  const created = await prisma.cmsContactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      metaJson: JSON.stringify({
        ip: meta.ip || null,
        userAgent: meta.userAgent || null,
        referer: meta.referer || null,
        source: meta.source || "web-public",
      }),
    },
  });

  await enqueueContactNotification(input, meta);

  return mapMessage(created);
}

export async function listCmsInboxMessages(query: CmsInboxListQueryInput) {
  const { page, pageSize, q, isRead, isResolved } = query;
  const where = buildInboxWhere({ q, isRead, isResolved });

  const [items, total] = await Promise.all([
    prisma.cmsContactMessage.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cmsContactMessage.count({ where }),
  ]);

  return {
    items: items.map((item) => mapMessage(item)),
    total,
    page,
    pageSize,
  };
}

export async function listCmsInboxMessagesForExport(query: CmsInboxExportQueryInput) {
  const where = buildInboxWhere(query);

  const items = await prisma.cmsContactMessage.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: CMS_INBOX_EXPORT_MAX_ROWS,
  });

  return items.map((item) => mapMessage(item));
}

export async function getCmsInboxMessageById(id: string) {
  const item = await prisma.cmsContactMessage.findUnique({ where: { id } });
  if (!item) {
    throw new CmsServiceError(404, "NOT_FOUND", "Inbox message not found");
  }

  return mapMessage(item);
}

export async function updateCmsInboxMessage(id: string, input: CmsInboxUpdateInput, userId: string) {
  await getCmsInboxMessageById(id);

  const updated = await prisma.cmsContactMessage.update({
    where: { id },
    data: {
      isRead: input.isRead,
      isResolved: input.isResolved,
    },
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "cms.inbox.update",
    entity: "CmsContactMessage",
    entityId: id,
  });

  return mapMessage(updated);
}
