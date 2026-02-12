import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dapodikStagingUpdateSchema } from "@/server/integrations/dapodik/dapodik.dto";
import { updateDapodikStagingRow } from "@/server/integrations/dapodik/dapodik.staging";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = dapodikStagingUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const updated = await updateDapodikStagingRow(id, parsed.data, userId);
  return NextResponse.json(updated);
}

