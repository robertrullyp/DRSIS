import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { prisma } from "@/lib/prisma";
import { s3, S3_BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSiteUrl } from "@/lib/site-url";

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const profile = await prisma.schoolProfile.findFirst();
  const title = profile?.name || "Sistem Informasi Sekolah";
  const description = profile?.motto || "Portal informasi sekolah";
  let ogImage: string | undefined;
  if (profile?.logoUrl) {
    if (/^https?:\/\//i.test(profile.logoUrl)) ogImage = profile.logoUrl;
    else {
      try {
        const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: profile.logoUrl });
        ogImage = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      } catch {
        // ignore
      }
    }
  }
  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    icons: {
      icon: ogImage ? [{ url: ogImage }] : undefined,
      apple: ogImage ? [{ url: ogImage }] : undefined,
    },
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  } satisfies Metadata;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var t = localStorage.getItem('theme') || 'system';
                  var m = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.setAttribute('data-theme', t === 'system' ? m : t);
                  document.documentElement.style.colorScheme = (t === 'system' ? m : t);
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${space.variable} ${fraunces.variable} ${mono.variable} antialiased bg-background text-foreground futuristic-bg`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
