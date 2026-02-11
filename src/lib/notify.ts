import { prisma } from "@/lib/prisma";

export async function queueWa(to: string | null | undefined, templateKey: string, payload?: Record<string, unknown>) {
  if (!to) return null;
  const tpl = await prisma.waTemplate.findUnique({ where: { key: templateKey } }).catch(() => null);
  const out = await prisma.waOutbox.create({ data: { to, templateId: tpl?.id, payload: payload ? JSON.stringify(payload) : null } as any });
  return out;
}

export async function queueEmail(to: string | null | undefined, templateKey: string, payload?: Record<string, unknown>, subject?: string) {
  if (!to) return null;
  const tpl = await prisma.emailTemplate.findUnique({ where: { key: templateKey } }).catch(() => null);
  const out = await prisma.emailOutbox.create({ data: { to, templateId: tpl?.id, payload: payload ? JSON.stringify(payload) : null, subject: subject ?? null } as any });
  return out;
}
