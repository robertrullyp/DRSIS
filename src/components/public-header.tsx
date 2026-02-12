import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPublicCmsMenu } from "@/server/cms/menu.service";

export default async function PublicHeader() {
  const session = await getServerSession(authOptions);
  const roles = Array.isArray(session?.user?.roles) ? session.user.roles : [];

  const [profile, menuItems] = await Promise.all([
    prisma.schoolProfile.findFirst(),
    getPublicCmsMenu("main", { isAuthenticated: Boolean(session?.user), roles }),
  ]);

  return (
    <header className="border-b border-border/70 bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-wide text-foreground sm:text-base">
          {profile?.name || "Portal Sekolah"}
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-md border border-transparent px-2.5 py-1.5 transition-colors hover:border-border hover:bg-muted/70"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="rounded-md border border-border px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted/70"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
