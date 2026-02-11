import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { cmsMediaPresignSchema } from "@/server/cms/dto/media.dto";
import { createCmsMediaPresignedUpload } from "@/server/cms/media.service";

export async function POST(req: NextRequest) {
  const auth = await authorizeCmsRequest(req, "write");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = cmsMediaPresignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const data = await createCmsMediaPresignedUpload(parsed.data);
  return NextResponse.json(data);
}
