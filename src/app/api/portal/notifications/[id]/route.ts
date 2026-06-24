import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { portalNotificationUpdateSchema } from "@/server/notifications/notification.dto";
import { updatePortalNotification } from "@/server/notifications/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = portalNotificationUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { id } = await ctx.params;
  const updated = await updatePortalNotification(id, auth.context.userId, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}
