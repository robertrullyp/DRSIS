import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { s3, S3_BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const profile = await prisma.schoolProfile.findFirst();
  const name = profile?.name || "Sistem Informasi Sekolah";
  let iconUrl: string | undefined;
  if (profile?.logoUrl) {
    if (/^https?:\/\//i.test(profile.logoUrl)) iconUrl = profile.logoUrl;
    else {
      try {
        const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: profile.logoUrl });
        iconUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      } catch {
        // ignore
      }
    }
  }
  return {
    name,
    short_name: name.slice(0, 12),
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    icons: iconUrl
      ? [
          { src: iconUrl, sizes: "192x192", type: "image/png" },
          { src: iconUrl, sizes: "512x512", type: "image/png" },
        ]
      : [],
  } satisfies MetadataRoute.Manifest;
}

