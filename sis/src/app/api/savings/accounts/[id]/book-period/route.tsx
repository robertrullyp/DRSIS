import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export const runtime = "nodejs";

const styles = StyleSheet.create({ page: { padding: 24, fontSize: 12 }, title: { fontSize: 16, marginBottom: 8, fontWeight: 700 }, row: { flexDirection: "row" }, cell: { flexGrow: 1, padding: 4 } });

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const startStr = req.nextUrl.searchParams.get("start");
  const endStr = req.nextUrl.searchParams.get("end");
  if (!startStr || !endStr) return NextResponse.json({ error: "start and end required" }, { status: 400 });
  const start = new Date(startStr);
  const end = new Date(endStr);
  const acc = await prisma.savingsAccount.findUnique({ where: { id }, include: { student: { include: { user: true } } } });
  if (!acc) return NextResponse.json({ error: "not found" }, { status: 404 });
  const before = await prisma.savingsTransaction.findMany({ where: { accountId: id, createdAt: { lt: start } }, orderBy: { createdAt: "asc" } });
  let bal = before.reduce((b, t) => b + (t.type === "WITHDRAWAL" ? -t.amount : t.amount), 0);
  const within = await prisma.savingsTransaction.findMany({ where: { accountId: id, createdAt: { gte: start, lte: end } }, orderBy: { createdAt: "asc" } });
  const rows = within.map((t) => { bal += (t.type === "WITHDRAWAL" ? -t.amount : t.amount); return { ts: t.createdAt, type: t.type, amount: t.amount, bal }; });
  const Doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Buku Tabungan (Periode)</Text>
        <Text>Siswa: {acc.student.user?.name ?? acc.studentId}</Text>
        <Text>Periode: {start.toISOString().slice(0,10)} s/d {end.toISOString().slice(0,10)}</Text>
        <Text>Saldo awal: {before.reduce((b, t) => b + (t.type === "WITHDRAWAL" ? -t.amount : t.amount), 0)}</Text>
        <View style={{ marginTop: 8 }}>
          <View style={styles.row}><Text style={[styles.cell,{flexBasis:'40%'}]}>Waktu</Text><Text style={[styles.cell,{flexBasis:'20%'}]}>Jenis</Text><Text style={[styles.cell,{flexBasis:'20%'}]}>Nominal</Text><Text style={[styles.cell,{flexBasis:'20%'}]}>Saldo</Text></View>
          {rows.map((r, i) => (
            <View key={i} style={styles.row}><Text style={[styles.cell,{flexBasis:'40%'}]}>{new Date(r.ts).toLocaleString()}</Text><Text style={[styles.cell,{flexBasis:'20%'}]}>{r.type}</Text><Text style={[styles.cell,{flexBasis:'20%'}]}>{r.amount}</Text><Text style={[styles.cell,{flexBasis:'20%'}]}>{r.bal}</Text></View>
          ))}
        </View>
      </Page>
    </Document>
  );
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const buf = await renderToBuffer(Doc);
  return new NextResponse(buf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename=book_${acc.id}_${startStr}_${endStr}.pdf` } });
}
