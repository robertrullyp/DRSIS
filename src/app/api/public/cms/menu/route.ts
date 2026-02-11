import { NextRequest, NextResponse } from "next/server";
import { getPublicCmsMenu } from "@/server/cms/menu.service";

export async function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get("name") || "main").trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const items = await getPublicCmsMenu(name);
  return NextResponse.json({ items });
}
