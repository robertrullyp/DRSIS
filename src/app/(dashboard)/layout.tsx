import { PropsWithChildren } from "react";
import { AppShell } from "@/components/app-shell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fdashboard");
  }
  return <AppShell>{children}</AppShell>;
}
