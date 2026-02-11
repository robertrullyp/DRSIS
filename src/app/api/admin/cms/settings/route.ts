import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { cmsPublicSettingsSchema } from "@/server/cms/dto/settings.dto";
import { getCmsPublicSettings, updateCmsPublicSettings } from "@/server/cms/settings.service";

export async function GET(req: NextRequest) {
  const auth = await authorizeCmsRequest(req, "admin");
  if (!auth.ok) return auth.response;

  const data = await getCmsPublicSettings();
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const auth = await authorizeCmsRequest(req, "admin");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = cmsPublicSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  await updateCmsPublicSettings(parsed.data);
  return NextResponse.json({ ok: true });
}
