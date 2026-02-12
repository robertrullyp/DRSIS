import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { lmsScoreImportSchema } from "@/server/integrations/lms/lms.dto";
import { importLmsScores, LmsServiceError } from "@/server/integrations/lms/lms.service";

async function requireUserId(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub;
  if (!userId) return null;
  return userId;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = lmsScoreImportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  try {
    const result = await importLmsScores(id, parsed.data, userId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof LmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

