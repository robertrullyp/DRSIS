import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/server/api/auth";
import { cbtQuestionCreateSchema } from "@/server/cbt/cbt.dto";
import { CbtServiceError, createCbtQuestion, listCbtQuestions } from "@/server/cbt/cbt.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(req, ["exam.manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const data = await listCbtQuestions(id);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(req, ["exam.manage"]);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = cbtQuestionCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { id } = await ctx.params;
  try {
    const created = await createCbtQuestion(id, parsed.data, auth.context.userId);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof CbtServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
