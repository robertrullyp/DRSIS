import type { MetadataRoute } from "next";
import { getCmsRobotsPayload } from "@/server/cms/seo.service";

export const revalidate = 3600;

export default function robots(): MetadataRoute.Robots {
  const payload = getCmsRobotsPayload();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: payload.sitemapUrl,
  };
}
