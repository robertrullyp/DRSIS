import { NextRequest, NextResponse } from "next/server";
import { getPublishedCmsPageBySlug } from "@/server/cms/page.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublishedCmsPageBySlug(slug);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}
