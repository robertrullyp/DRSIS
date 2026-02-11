import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fprofile");
  }
  const user = await prisma.user.findUnique({
    where: { id: (session as any).user.id },
    include: { role: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Profil Saya</h1>
      <div className="grid gap-3 max-w-xl">
        <div className="border rounded p-3">
          <div className="text-sm text-gray-500">Nama</div>
          <div>{user?.name ?? "-"}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-sm text-gray-500">Email</div>
          <div>{user?.email}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-sm text-gray-500">Peran</div>
          <div>{user?.role?.displayName ?? user?.role?.name ?? "-"}</div>
        </div>
      </div>
    </div>
  );
}

