import { NextRequest, NextResponse } from "next/server";
import { processWaOutbox } from "@/server/notifications/outbox";

export async function POST(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
  const result = await processWaOutbox(limit);
  return NextResponse.json(result);
}
