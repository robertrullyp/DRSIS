import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { lmsLinkCreateSchema, lmsLinkListQuerySchema } from "@/server/integrations/lms/lms.dto";
import { createLmsLink, listLmsLinks, LmsServiceError } from "@/server/integrations/lms/lms.service";

async function requireUserId(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub;
  if (!userId) return null;
  return userId;
}

export async function GET(req: NextRequest) {
  const parsed = lmsLinkListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const data = await listLmsLinks(parsed.data);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = lmsLinkCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  try {
    const created = await createLmsLink(parsed.data, userId);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof LmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

