import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { s3, S3_BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function AuthErrorPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const code = (searchParams["error"] as string | undefined) || "Unknown";
  const profile = await prisma.schoolProfile.findFirst();
  let logoSignedUrl: string | undefined;
  if (profile?.logoUrl) {
    if (/^https?:\/\//i.test(profile.logoUrl)) logoSignedUrl = profile.logoUrl;
    else {
      try {
        const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: profile.logoUrl });
        logoSignedUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      } catch {}
    }
  }
  const map: Record<string, string> = {
    Configuration: "Konfigurasi auth bermasalah.",
    AccessDenied: "Akses ditolak.",
    Verification: "Verifikasi diperlukan.",
    Default: "Terjadi kesalahan saat autentikasi.",
  };
  const message = map[code] || map.Default;
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="flex justify-center">
          {logoSignedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSignedUrl} alt="Logo Sekolah" className="h-12 w-12 rounded-md object-contain bg-white/60" />
          ) : (
            <span className="text-2xl">🏫</span>
          )}
        </div>
        <div className="text-lg font-semibold">{profile?.name || "Sistem Informasi Sekolah"}</div>
        <div className="rounded-xl p-4 glass-card">
          <div className="text-red-600 font-medium mb-1">Error: {code}</div>
          <div className="text-sm text-muted-foreground">{message}</div>
        </div>
        <div className="flex gap-3 justify-center text-sm">
          <Link href="/sign-in" className="px-3 py-1 rounded border border-border hover:bg-muted">Kembali ke Sign In</Link>
          <Link href="/" className="px-3 py-1 rounded border border-border hover:bg-muted">Beranda</Link>
        </div>
      </div>
    </div>
  );
}

