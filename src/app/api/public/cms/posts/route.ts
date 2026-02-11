import { NextRequest, NextResponse } from "next/server";
import { cmsPublicPostListQuerySchema } from "@/server/cms/dto/post.dto";
import { listPublishedCmsPosts } from "@/server/cms/post.service";

export async function GET(req: NextRequest) {
  const query = cmsPublicPostListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!query.success) {
    return NextResponse.json({ error: query.error.format() }, { status: 400 });
  }

  const data = await listPublishedCmsPosts(query.data);
  return NextResponse.json(data);
}
