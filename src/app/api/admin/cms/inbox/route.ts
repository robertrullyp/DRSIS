import { NextRequest, NextResponse } from "next/server";
import { authorizeCmsRequest } from "@/server/cms/cms.permissions";
import { cmsInboxListQuerySchema } from "@/server/cms/dto/contact.dto";
import { listCmsInboxMessages } from "@/server/cms/inbox.service";

export async function GET(req: NextRequest) {
  const auth = await authorizeCmsRequest(req, "read");
  if (!auth.ok) return auth.response;

  const query = cmsInboxListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!query.success) {
    return NextResponse.json({ error: query.error.format() }, { status: 400 });
  }

  const data = await listCmsInboxMessages(query.data);
  return NextResponse.json(data);
}
