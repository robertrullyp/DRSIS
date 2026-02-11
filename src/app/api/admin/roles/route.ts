import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.role.findMany({ orderBy: { name: "asc" }, include: { perms: { include: { permission: true } } } });
  return NextResponse.json({ items });
}
