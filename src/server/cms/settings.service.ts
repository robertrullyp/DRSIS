import { prisma } from "@/lib/prisma";
import type { CmsPublicSettingsInput } from "@/server/cms/dto/settings.dto";

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

export async function updateCmsPublicSettings(input: CmsPublicSettingsInput) {
  const value = JSON.stringify(input);
  return prisma.cmsSetting.upsert({
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
}
