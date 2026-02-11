import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { CmsServiceError, publishCmsPage } from "@/server/cms/page.service";
import { revalidateCmsMenu, revalidateCmsPublicContent } from "@/server/cms/revalidate";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeCmsRequest(req, "publish");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const item = await publishCmsPage(id, auth.context.userId);
    revalidateCmsMenu();
    revalidateCmsPublicContent();
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
