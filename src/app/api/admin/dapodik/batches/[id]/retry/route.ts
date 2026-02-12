import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { retryDapodikSyncBatch } from "@/server/integrations/dapodik/dapodik.queue";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const updated = await retryDapodikSyncBatch(id, userId);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

