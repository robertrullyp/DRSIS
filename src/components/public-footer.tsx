import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPublicCmsMenu } from "@/server/cms/menu.service";

export default async function PublicFooter() {
  const session = await getServerSession(authOptions);
  const roles = Array.isArray(session?.user?.roles) ? session.user.roles : [];

  const [profile, footerLinks] = await Promise.all([
    prisma.schoolProfile.findFirst(),
    getPublicCmsMenu("footer", { isAuthenticated: Boolean(session?.user), roles }),
  ]);
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
              {footerLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {footerLinks.map((item) => (
                    <Link key={item.id} href={item.href} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted/70">
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
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
