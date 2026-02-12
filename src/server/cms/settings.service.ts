import { prisma } from "@/lib/prisma";
import type { CmsPublicSettingsInput } from "@/server/cms/dto/settings.dto";
import { writeAuditEvent } from "@/server/audit";

export const CMS_PUBLIC_SETTINGS_KEY = "cms.public.settings";

export const defaultCmsPublicSettings: CmsPublicSettingsInput = {
  siteTitle: "Portal Publik Sekolah",
  siteTagline: "Informasi resmi sekolah",
  homeHeroTitle: "Portal Informasi Sekolah",
  homeHeroSubtitle: "Akses berita, agenda, galeri, dan informasi publik terbaru.",
  contactEmail: undefined,
  contactPhone: undefined,
  contactAddress: undefined,
  announcementBanner: undefined,
  primaryCtaLabel: "Lihat Berita",
  primaryCtaUrl: "/berita",
  secondaryCtaLabel: "Hubungi Sekolah",
  secondaryCtaUrl: "/kontak",
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function getCmsPublicSettings() {
  const row = await prisma.cmsSetting.findUnique({
    where: { key: CMS_PUBLIC_SETTINGS_KEY },
    select: { value: true },
  });

  if (!row?.value) {
    return defaultCmsPublicSettings;
  }

  try {
    const parsed = JSON.parse(row.value) as unknown;
    if (!isObjectRecord(parsed)) return defaultCmsPublicSettings;

    return {
      ...defaultCmsPublicSettings,
      ...parsed,
    } as CmsPublicSettingsInput;
  } catch {
    return defaultCmsPublicSettings;
  }
}

export async function updateCmsPublicSettings(input: CmsPublicSettingsInput, userId: string) {
  const value = JSON.stringify(input);
  const updated = await prisma.cmsSetting.upsert({
    where: { key: CMS_PUBLIC_SETTINGS_KEY },
    update: {
      value,
      description: "Public CMS settings (home hero, contact, CTA).",
    },
    create: {
      key: CMS_PUBLIC_SETTINGS_KEY,
      value,
      description: "Public CMS settings (home hero, contact, CTA).",
    },
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "cms.settings.update",
    entity: "CmsSetting",
    entityId: updated.id,
    meta: { key: CMS_PUBLIC_SETTINGS_KEY },
  });

  return updated;
}
