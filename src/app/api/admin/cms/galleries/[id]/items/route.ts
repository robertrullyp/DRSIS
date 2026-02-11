import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { cmsGallerySetItemsSchema } from "@/server/cms/dto/gallery.dto";
import { CmsServiceError } from "@/server/cms/page.service";
import { getCmsGalleryById, setCmsGalleryItems } from "@/server/cms/gallery.service";
import { revalidateCmsPublicContent } from "@/server/cms/revalidate";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeCmsRequest(req, "read");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const gallery = await getCmsGalleryById(id);
    return NextResponse.json({ items: gallery.items });
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeCmsRequest(req, "write");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = cmsGallerySetItemsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    const { id } = await params;
    const updated = await setCmsGalleryItems(id, parsed.data, auth.context.userId);
    revalidateCmsPublicContent();
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
