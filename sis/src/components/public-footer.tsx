import { prisma } from "@/lib/prisma";

export default async function PublicFooter() {
  const profile = await prisma.schoolProfile.findFirst();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-border py-8 text-sm text-muted-foreground">
      <div className="max-w-5xl mx-auto px-4 grid gap-2">
        {profile?.name ? <div className="font-medium text-foreground">{profile.name}</div> : null}
        {profile?.address ? <div>Alamat: {profile.address}</div> : null}
        <div className="flex flex-wrap gap-4">
          {profile?.phone ? <div>Telp: {profile.phone}</div> : null}
          {profile?.email ? <div>Email: {profile.email}</div> : null}
          {profile?.website ? (
            <div>
              Situs: <a href={profile.website} className="underline" target="_blank" rel="noreferrer">{profile.website}</a>
            </div>
          ) : null}
        </div>
        <div className="text-xs text-muted-foreground mt-2">© {year} {profile?.name || "Sekolah"}. All rights reserved.</div>
      </div>
    </footer>
  );
}

