import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { s3, S3_BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import PublicFooter from "@/components/public-footer";

export default async function Home() {
  const profile = await prisma.schoolProfile.findFirst();
  let logoSignedUrl: string | undefined;
  if (profile?.logoUrl) {
    if (/^https?:\/\//i.test(profile.logoUrl)) logoSignedUrl = profile.logoUrl;
    else {
      try {
        const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: profile.logoUrl });
        logoSignedUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      } catch {
        // ignore presign error
      }
    }
  }
  return (
    <main className="min-h-[calc(100vh-0px)] p-8">
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            {logoSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSignedUrl} alt="Logo Sekolah" className="h-16 w-16 rounded-md object-contain bg-white/60" />
            ) : null}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            <span className="bg-[linear-gradient(90deg,var(--accent),#8b5cf6)] bg-clip-text text-transparent">
              {profile?.name || "Sistem Informasi Sekolah"}
            </span>
          </h1>
          {profile?.address ? (
            <p className="text-xs sm:text-sm text-muted-foreground">{profile.address}</p>
          ) : null}
          <p className="text-sm sm:text-base text-muted-foreground">
            Portal publik untuk pengumuman, pendaftaran, dan akses cepat ke informasi.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/ppdb/announcement" className="block rounded-xl p-5 glass-card hover:shadow-lg transition-shadow">
            <span className="font-medium">Pengumuman PPDB</span>
            <p className="text-sm text-muted-foreground mt-1">Lihat pengumuman penerimaan peserta didik baru.</p>
          </Link>
          <Link href="/ppdb/apply" className="block rounded-xl p-5 glass-card hover:shadow-lg transition-shadow">
            <span className="font-medium">Daftar PPDB</span>
            <p className="text-sm text-muted-foreground mt-1">Ajukan pendaftaran secara online.</p>
          </Link>
          <Link href="/ppdb/status" className="block rounded-xl p-5 glass-card hover:shadow-lg transition-shadow">
            <span className="font-medium">Cek Status PPDB</span>
            <p className="text-sm text-muted-foreground mt-1">Lacak status pendaftaran Anda.</p>
          </Link>
          <Link href="/dashboard" className="block rounded-xl p-5 glass-card hover:shadow-lg transition-shadow">
            <span className="font-medium">Masuk Dashboard</span>
            <p className="text-sm text-muted-foreground mt-1">Khusus untuk pengguna terdaftar.</p>
          </Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
