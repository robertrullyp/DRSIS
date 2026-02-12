import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { summarizeInvoice } from "@/server/finance/invoice-balance";

const invoiceUpdateSchema = z.object({
  dueDate: z.coerce.date().nullable().optional(),
  status: z.enum(["DRAFT", "OPEN", "PARTIAL", "PAID", "VOID"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      student: { include: { user: true } },
      academicYear: true,
      items: true,
      discounts: true,
      payments: { include: { refunds: true } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ...invoice, balance: summarizeInvoice(invoice) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = invoiceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const updated = await prisma.invoice.update({
    where: { id },
    data: parsed.data,
    include: {
      student: { include: { user: true } },
      academicYear: true,
      items: true,
      discounts: true,
      payments: { include: { refunds: true } },
    },
  });
  return NextResponse.json({ ...updated, balance: summarizeInvoice(updated) });
}
