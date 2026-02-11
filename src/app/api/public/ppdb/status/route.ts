import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const birthDate = req.nextUrl.searchParams.get("birthDate");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  const where: any = { email };
  if (birthDate) {
    const d = new Date(birthDate);
    if (!Number.isNaN(d.getTime())) where.birthDate = d;
  }
  const app = await prisma.admissionApplication.findFirst({ where, include: { gradeApplied: true } });
  if (!app) return NextResponse.json({ found: false });
  return NextResponse.json({ found: true, status: app.status, grade: app.gradeApplied?.name ?? null });
}

