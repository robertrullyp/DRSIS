import { NextRequest, NextResponse } from "next/server";
import { dapodikStagingUpdateSchema } from "@/server/integrations/dapodik/dapodik.dto";
import { updateDapodikStagingRow } from "@/server/integrations/dapodik/dapodik.staging";
import { requireApiPermission } from "@/server/api/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(req, ["dapodik.manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = dapodikStagingUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const updated = await updateDapodikStagingRow(id, parsed.data, auth.context.userId);
  return NextResponse.json(updated);
}
