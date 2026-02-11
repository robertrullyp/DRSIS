import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { cmsPostCreateSchema, cmsPostListQuerySchema } from "@/server/cms/dto/post.dto";
import { CmsServiceError } from "@/server/cms/page.service";
import { createCmsPost, listCmsPosts } from "@/server/cms/post.service";
import { revalidateCmsPublicContent } from "@/server/cms/revalidate";

export async function GET(req: NextRequest) {
  const auth = await authorizeCmsRequest(req, "read");
  if (!auth.ok) return auth.response;

  const query = cmsPostListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!query.success) {
    return NextResponse.json({ error: query.error.format() }, { status: 400 });
  }

  const data = await listCmsPosts(query.data);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await authorizeCmsRequest(req, "write");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = cmsPostCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  try {
    const created = await createCmsPost(parsed.data, auth.context.userId);
    revalidateCmsPublicContent();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof CmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
