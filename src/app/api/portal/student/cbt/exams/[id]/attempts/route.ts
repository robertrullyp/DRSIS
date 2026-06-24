import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { cbtAttemptSubmitSchema } from "@/server/cbt/cbt.dto";
import { CbtServiceError, startOrSubmitPortalCbtAttempt } from "@/server/cbt/cbt.service";
import { resolvePortalStudentContext } from "@/server/portal/student-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const parsed = cbtAttemptSubmitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const requestedStudentId = req.nextUrl.searchParams.get("childId");
  const { studentId, classroomId } = await resolvePortalStudentContext(auth.context.userId, requestedStudentId);
  if (!studentId) return NextResponse.json({ error: "No student context" }, { status: 403 });

  const { id } = await ctx.params;
  try {
    const result = await startOrSubmitPortalCbtAttempt({
      examId: id,
      studentId,
      classroomId,
      payload: parsed.data,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CbtServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
