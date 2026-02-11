import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { createCmsPostPreviewToken } from "@/server/cms/post-preview";
import { CmsServiceError } from "@/server/cms/page.service";
import { getCmsPostById } from "@/server/cms/post.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeCmsRequest(req, "read");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await getCmsPostById(id);
    const token = createCmsPostPreviewToken(id);
    const url = `/berita/preview?token=${encodeURIComponent(token)}`;
    return NextResponse.json({ token, url });
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
