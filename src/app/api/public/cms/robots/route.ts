import { NextResponse } from "next/server";
import { buildRobotsTxt, getCmsRobotsPayload } from "@/server/cms/seo.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = getCmsRobotsPayload();
  const text = buildRobotsTxt(payload);

  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
