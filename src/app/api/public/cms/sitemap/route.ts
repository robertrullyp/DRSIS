import { NextResponse } from "next/server";
import { buildSitemapXml, getCmsSitemapPayload } from "@/server/cms/seo.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getCmsSitemapPayload();
  const xml = buildSitemapXml(payload);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
