import { NextRequest, NextResponse } from "next/server";
import { cmsPublicGalleryListQuerySchema } from "@/server/cms/dto/gallery.dto";
import { listPublishedCmsGalleries } from "@/server/cms/gallery.service";

export async function GET(req: NextRequest) {
  const query = cmsPublicGalleryListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!query.success) {
    return NextResponse.json({ error: query.error.format() }, { status: 400 });
  }

  const data = await listPublishedCmsGalleries(query.data);
  return NextResponse.json(data);
}
