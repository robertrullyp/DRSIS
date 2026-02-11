import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => {
      if (typeof value === "undefined") return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    });

export const cmsPublicSettingsSchema = z.object({
  siteTitle: optionalTrimmedString(120),
  siteTagline: optionalTrimmedString(200),
  homeHeroTitle: optionalTrimmedString(160),
  homeHeroSubtitle: optionalTrimmedString(500),
  contactEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  contactPhone: optionalTrimmedString(50),
  contactAddress: optionalTrimmedString(500),
  announcementBanner: optionalTrimmedString(300),
  primaryCtaLabel: optionalTrimmedString(80),
  primaryCtaUrl: optionalTrimmedString(300),
  secondaryCtaLabel: optionalTrimmedString(80),
  secondaryCtaUrl: optionalTrimmedString(300),
});

export type CmsPublicSettingsInput = z.infer<typeof cmsPublicSettingsSchema>;
