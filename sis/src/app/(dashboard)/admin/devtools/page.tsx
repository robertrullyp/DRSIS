import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDevtoolsPage() {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as any)?.roles as string[] | undefined;
  const isAdmin = !!roles?.includes("admin");
  if (!isAdmin) redirect("/dashboard");

  const info = {
    user: {
      id: (session?.user as any)?.id ?? null,
      email: session?.user?.email ?? null,
      roles: roles ?? [],
    },
    runtime: {
      node: process.version,
      env: process.env.NODE_ENV,
    },
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin Devtools</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="glass-card rounded-xl p-4">
          <h2 className="font-medium mb-2">Session</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(info.user, null, 2)}</pre>
        </section>

        <section className="glass-card rounded-xl p-4">
          <h2 className="font-medium mb-2">Runtime</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(info.runtime, null, 2)}</pre>
        </section>
      </div>

      <section className="glass-card rounded-xl p-4">
        <h2 className="font-medium mb-2">Utilities</h2>
        <ul className="text-sm list-disc list-inside text-muted-foreground">
          <li>Gunakan halaman ini untuk cek sesi, role, dan environment.</li>
          <li>Tambahkan utilitas admin lain sesuai kebutuhan (import/export, seeding, dsb.).</li>
        </ul>
      </section>
    </div>
  );
}

