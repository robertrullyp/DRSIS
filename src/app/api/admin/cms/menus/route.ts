import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { listCmsMenus } from "@/server/cms/menu.service";

export async function GET(req: NextRequest) {
  const auth = await authorizeCmsRequest(req, "read");
  if (!auth.ok) return auth.response;

  const items = await listCmsMenus();
  return NextResponse.json({ items });
}
