import { NextRequest, NextResponse } from "next/server";
import { lmsScoreListQuerySchema } from "@/server/integrations/lms/lms.dto";
import { listLmsScores, LmsServiceError } from "@/server/integrations/lms/lms.service";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = lmsScoreListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  try {
    const data = await listLmsScores(id, parsed.data);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof LmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

