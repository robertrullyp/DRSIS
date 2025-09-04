import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-0px)] p-8">
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            <span className="bg-[linear-gradient(90deg,var(--accent),#8b5cf6)] bg-clip-text text-transparent">
              Sistem Informasi Sekolah
            </span>
          </h1>
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
    </main>
  );
}
