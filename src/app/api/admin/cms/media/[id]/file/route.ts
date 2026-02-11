import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { getCmsMediaSignedReadUrl } from "@/server/cms/media.service";
import { CmsServiceError } from "@/server/cms/page.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeCmsRequest(req, "read");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const data = await getCmsMediaSignedReadUrl(id);
    return NextResponse.redirect(data.url, { status: 302 });
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
