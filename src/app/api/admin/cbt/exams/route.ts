import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/server/api/auth";
import { cbtExamCreateSchema, cbtExamListQuerySchema } from "@/server/cbt/cbt.dto";
import { createCbtExam, listCbtExams } from "@/server/cbt/cbt.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, ["exam.manage"]);
  if (!auth.ok) return auth.response;

  const parsed = cbtExamListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const data = await listCbtExams(parsed.data);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, ["exam.manage"]);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = cbtExamCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const created = await createCbtExam(parsed.data, auth.context.userId);
  return NextResponse.json(created, { status: 201 });
}
