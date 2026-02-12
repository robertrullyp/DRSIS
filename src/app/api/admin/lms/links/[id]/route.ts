import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { lmsLinkUpdateSchema } from "@/server/integrations/lms/lms.dto";
import { deleteLmsLink, getLmsLinkById, LmsServiceError, updateLmsLink } from "@/server/integrations/lms/lms.service";

async function requireUserId(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub;
  if (!userId) return null;
  return userId;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const item = await getLmsLinkById(id);
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof LmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = lmsLinkUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  try {
    const updated = await updateLmsLink(id, parsed.data, userId);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof LmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    await deleteLmsLink(id, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof LmsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

