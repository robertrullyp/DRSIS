import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { resolvePortalStudentContext } from "@/server/portal/student-context";
import { listAvailablePortalCbtExams } from "@/server/cbt/cbt.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;

  const requestedStudentId = req.nextUrl.searchParams.get("childId");
  const { studentId, classroomId } = await resolvePortalStudentContext(auth.context.userId, requestedStudentId);
  if (!studentId) return NextResponse.json({ items: [] });

  const data = await listAvailablePortalCbtExams({ studentId, classroomId });
  return NextResponse.json(data);
}
