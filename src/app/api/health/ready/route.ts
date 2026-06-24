import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateRuntimeConfig } from "@/server/runtime-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ts = new Date().toISOString();
  const configChecks = validateRuntimeConfig();
  const configOk = configChecks.every((check) => check.ok);

  try {
    // Readiness: verify DB connectivity without leaking internal details.
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: configOk,
      ts,
      db: { ok: true },
      config: {
        ok: configOk,
        checks: configChecks.map(({ ok, code, message }) => ({ ok, code, message })),
      },
    }, { status: configOk ? 200 : 503 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        ts,
        db: { ok: false },
        config: {
          ok: configOk,
          checks: configChecks.map(({ ok, code, message }) => ({ ok, code, message })),
        },
        error: "DB_UNREACHABLE",
      },
      { status: 503 },
    );
  }
}
