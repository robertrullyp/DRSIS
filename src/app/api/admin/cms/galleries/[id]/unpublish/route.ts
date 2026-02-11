import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { CmsServiceError } from "@/server/cms/page.service";
import { unpublishCmsGallery } from "@/server/cms/gallery.service";
import { revalidateCmsPublicContent } from "@/server/cms/revalidate";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeCmsRequest(req, "publish");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const updated = await unpublishCmsGallery(id, auth.context.userId);
    revalidateCmsPublicContent();
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
