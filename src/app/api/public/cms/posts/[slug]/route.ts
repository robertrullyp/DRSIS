import { NextRequest, NextResponse } from "next/server";
import { getPublishedCmsPostBySlug } from "@/server/cms/post.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedCmsPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}
