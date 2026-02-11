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

  const quickActions = [
    {
      href: "/ppdb/apply",
      title: "Daftar PPDB",
      description: "Kirim pendaftaran online dengan alur dokumen yang lebih cepat.",
      tone: "var(--accent)",
      badge: "Action",
    },
    {
      href: "/ppdb/status",
      title: "Pantau Status",
      description: "Lacak progres verifikasi dan hasil seleksi real-time.",
      tone: "var(--accent-2)",
      badge: "Tracking",
    },
    {
      href: "/ppdb/announcement",
      title: "Pengumuman PPDB",
      description: "Akses daftar hasil seleksi berdasarkan tingkat dan nama.",
      tone: "var(--accent)",
      badge: "Public",
    },
    {
      href: "/dashboard",
      title: "Masuk Dashboard",
      description: "Kelola akademik, operasional, dan layanan siswa dalam satu panel.",
      tone: "var(--accent-2)",
      badge: "Internal",
    },
  ];

  return (
    <main className="min-h-screen px-4 pb-8 sm:px-8">
      <section className="mx-auto max-w-6xl space-y-8 py-8 sm:space-y-10 sm:py-12">
        <div className="neo-card glass-card surface-grid p-6 sm:p-8 lg:p-10">
          <div className="stagger-in grid items-start gap-7 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-5">
              <span className="soft-badge">Portal Sekolah Digital</span>
              <div className="space-y-3">
                <h1 className="text-3xl leading-tight sm:text-5xl">
                  {profile?.name || "Sistem Informasi Sekolah"}
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Dashboard dan portal publik kini tampil dengan pendekatan visual yang lebih dinamis:
                  cepat, fokus, dan nyaman digunakan dari ponsel sampai desktop.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground sm:text-sm">
                <span className="rounded-full border border-border bg-card px-3 py-1">Realtime workflow</span>
                <span className="rounded-full border border-border bg-card px-3 py-1">Data terpusat</span>
                <span className="rounded-full border border-border bg-card px-3 py-1">Akses multi-perangkat</span>
              </div>
            </div>
            <div className="neo-card interactive-lift p-4 sm:p-5">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {logoSignedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoSignedUrl} alt="Logo Sekolah" className="h-12 w-12 rounded-lg object-contain bg-white/70 p-1" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-muted text-lg">SC</div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">School Identity</p>
                    <p className="font-medium leading-tight">{profile?.name || "SIS Campus"}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Alamat</p>
                  <p className="mt-1 text-sm">{profile?.address || "Alamat sekolah belum diatur."}</p>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground interactive-lift"
                >
                  Buka Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="stagger-in grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="neo-card interactive-lift p-5"
              style={{ backgroundColor: `color-mix(in oklab, ${item.tone} 13%, transparent)` }}
            >
              <div className="space-y-3">
                <span className="soft-badge">{item.badge}</span>
                <h2 className="text-xl leading-tight">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="neo-card p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">What is new</p>
            <h3 className="mt-2 text-2xl">Pengalaman lebih interaktif</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Desain terbaru menggabungkan layout modular, animasi ringan, dan komponen dengan
              kontras tinggi agar informasi cepat dipahami tanpa mengorbankan estetika.
            </p>
          </div>
          <div className="neo-card p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Use cases</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Publik</p>
                <p className="mt-1 text-sm font-medium">Akses cepat PPDB</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Siswa/Ortu</p>
                <p className="mt-1 text-sm font-medium">Portal akademik</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Staff/Admin</p>
                <p className="mt-1 text-sm font-medium">Operasional terpadu</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
