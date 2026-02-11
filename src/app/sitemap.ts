import type { MetadataRoute } from "next";
import { getCmsSitemapPayload } from "@/server/cms/seo.service";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getCmsSitemapPayload();
  return payload.entries.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified,
  }));
}
