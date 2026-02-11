import { NextRequest, NextResponse } from "next/server";
import { consumeCmsContactRateLimit } from "@/server/cms/contact-rate-limit";
import { cmsContactCreateSchema } from "@/server/cms/dto/contact.dto";
import { createCmsContactMessage } from "@/server/cms/inbox.service";

function resolveClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = cmsContactCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  // Honeypot field: silently accept and drop bot submissions.
  if (parsed.data._company && parsed.data._company.trim().length > 0) {
    return NextResponse.json({ ok: true, accepted: true }, { status: 202 });
  }

  const ip = resolveClientIp(req);
  const rateLimit = consumeCmsContactRateLimit(ip);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak pengiriman. Silakan coba lagi beberapa saat.", retryAfter: rateLimit.retryAfterSeconds },
      {
        status: 429,
        headers: rateLimit.retryAfterSeconds
          ? {
              "Retry-After": String(rateLimit.retryAfterSeconds),
            }
          : undefined,
      }
    );
  }

  const created = await createCmsContactMessage(parsed.data, {
    ip,
    userAgent: req.headers.get("user-agent"),
    referer: req.headers.get("referer"),
    source: "public-contact-form",
  });

  return NextResponse.json(
    {
      ok: true,
      id: created.id,
      createdAt: created.createdAt,
    },
    { status: 201 }
  );
}
