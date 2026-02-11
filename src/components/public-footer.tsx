import { prisma } from "@/lib/prisma";

export default async function PublicFooter() {
  const profile = await prisma.schoolProfile.findFirst();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-border/80 py-10 text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="neo-card p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-2">
              {profile?.name ? <div className="font-medium text-foreground">{profile.name}</div> : null}
              {profile?.address ? <div>Alamat: {profile.address}</div> : null}
              <div className="flex flex-wrap gap-4">
                {profile?.phone ? <div>Telp: {profile.phone}</div> : null}
                {profile?.email ? <div>Email: {profile.email}</div> : null}
              </div>
            </div>
            <div className="space-y-2 text-left md:text-right">
              <div className="text-xs uppercase tracking-[0.14em]">Informasi</div>
              <div>Portal publik dan dashboard sekolah terpadu.</div>
            </div>
          </div>
          {profile?.website ? (
            <div>
              Situs: <a href={profile.website} className="underline" target="_blank" rel="noreferrer">{profile.website}</a>
            </div>
          ) : null}
          <div className="mt-2 text-xs text-muted-foreground">© {year} {profile?.name || "Sekolah"}. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
