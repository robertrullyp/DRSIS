import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { cmsPageUpdateSchema } from "@/server/cms/dto/page.dto";
import { CmsServiceError, deleteCmsPage, getCmsPageById, updateCmsPage } from "@/server/cms/page.service";
import { revalidateCmsMenu, revalidateCmsPublicContent } from "@/server/cms/revalidate";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeCmsRequest(req, "read");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const item = await getCmsPageById(id);
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeCmsRequest(req, "write");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = cmsPageUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    const { id } = await params;
    const updated = await updateCmsPage(id, parsed.data, auth.context.userId);
    revalidateCmsMenu();
    revalidateCmsPublicContent();
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeCmsRequest(req, "write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const deleted = await deleteCmsPage(id, auth.context.userId);
    revalidateCmsMenu();
    revalidateCmsPublicContent();
    return NextResponse.json(deleted);
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
