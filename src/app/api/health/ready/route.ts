import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ts = new Date().toISOString();

  try {
    // Readiness: verify DB connectivity without leaking internal details.
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ts, db: { ok: true } });
  } catch {
    return NextResponse.json(
      { ok: false, ts, db: { ok: false }, error: "DB_UNREACHABLE" },
      { status: 503 },
    );
  }
}

