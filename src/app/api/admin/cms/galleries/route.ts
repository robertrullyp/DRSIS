import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { cmsGalleryCreateSchema, cmsGalleryListQuerySchema } from "@/server/cms/dto/gallery.dto";
import {
  createCmsGallery,
  listCmsGalleries,
} from "@/server/cms/gallery.service";
import { CmsServiceError } from "@/server/cms/page.service";
import { revalidateCmsPublicContent } from "@/server/cms/revalidate";

export async function GET(req: NextRequest) {
  const auth = await authorizeCmsRequest(req, "read");
  if (!auth.ok) return auth.response;

  const query = cmsGalleryListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!query.success) {
    return NextResponse.json({ error: query.error.format() }, { status: 400 });
  }

  const data = await listCmsGalleries(query.data);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await authorizeCmsRequest(req, "write");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = cmsGalleryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    const created = await createCmsGallery(parsed.data, auth.context.userId);
    revalidateCmsPublicContent();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
