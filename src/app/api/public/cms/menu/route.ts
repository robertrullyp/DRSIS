import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPublicCmsMenu } from "@/server/cms/menu.service";

export async function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get("name") || "main").trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const roles = Array.isArray(session?.user?.roles) ? session.user.roles : [];

  const items = await getPublicCmsMenu(name, {
    isAuthenticated: Boolean(session?.user),
    roles,
  });
  return NextResponse.json({ items });
}
