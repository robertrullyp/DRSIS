import { NextRequest, NextResponse } from "next/server";
import { cmsPublicEventListQuerySchema } from "@/server/cms/dto/event.dto";
import { listPublishedCmsEvents } from "@/server/cms/event.service";

export async function GET(req: NextRequest) {
  const query = cmsPublicEventListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!query.success) {
    return NextResponse.json({ error: query.error.format() }, { status: 400 });
  }

  const data = await listPublishedCmsEvents(query.data);
  return NextResponse.json(data);
}
