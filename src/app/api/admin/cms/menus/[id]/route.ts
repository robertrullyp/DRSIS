import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { cmsMenuReplaceSchema } from "@/server/cms/dto/menu.dto";
import { replaceCmsMenuItems } from "@/server/cms/menu.service";
import { CmsServiceError } from "@/server/cms/page.service";
import { revalidateCmsMenu } from "@/server/cms/revalidate";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeCmsRequest(req, "admin");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = cmsMenuReplaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    const { id } = await params;
    const item = await replaceCmsMenuItems(id, parsed.data, auth.context.userId);
    revalidateCmsMenu();
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
