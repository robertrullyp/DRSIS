import { NextRequest, NextResponse } from "next/server";
import { getPublishedCmsGalleryBySlug } from "@/server/cms/gallery.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await getPublishedCmsGalleryBySlug(slug);
  if (!gallery) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(gallery);
}
