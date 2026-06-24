import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/server/api/auth";
import {
  notificationAdminListQuerySchema,
  notificationCreateSchema,
} from "@/server/notifications/notification.dto";
import { createNotification, listAdminNotifications } from "@/server/notifications/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, ["notification.manage"]);
  if (!auth.ok) return auth.response;

  const parsed = notificationAdminListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const data = await listAdminNotifications(parsed.data);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, ["notification.manage"]);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = notificationCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const created = await createNotification(parsed.data, auth.context.userId);
  return NextResponse.json(created, { status: 201 });
}
