import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ppdbVerifySchema } from "@/lib/schemas/ppdb";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = ppdbVerifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const verified = parsed.data.verified;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const verifierId = (token as any)?.sub as string | undefined;
  if (!verifierId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const updated = await prisma.admissionApplication.update({
    where: { id },
    data: {
      status: verified ? "VERIFIED" : "PENDING",
      verifiedAt: verified ? new Date() : null,
      verifiedById: verified ? verifierId : null,
    },
  });
  return NextResponse.json(updated);
}
