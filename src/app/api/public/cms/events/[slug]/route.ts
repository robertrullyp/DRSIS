import { NextRequest, NextResponse } from "next/server";
import { getPublishedCmsEventBySlug } from "@/server/cms/event.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublishedCmsEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}
