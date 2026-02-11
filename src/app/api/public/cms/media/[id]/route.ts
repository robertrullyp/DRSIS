import { NextRequest, NextResponse } from "next/server";
import { getCmsMediaPublicSignedReadUrl } from "@/server/cms/media.service";
import { CmsServiceError } from "@/server/cms/page.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await getCmsMediaPublicSignedReadUrl(id);
    return NextResponse.redirect(data.url, { status: 302 });
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
