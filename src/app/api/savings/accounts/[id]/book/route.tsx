import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export const runtime = "nodejs";

const styles = StyleSheet.create({ page: { padding: 24, fontSize: 12 }, title: { fontSize: 16, marginBottom: 8, fontWeight: 700 }, row: { flexDirection: "row" }, cell: { flexGrow: 1, padding: 4 } });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const acc = await prisma.savingsAccount.findUnique({ where: { id }, include: { student: { include: { user: true } }, transactions: { orderBy: { createdAt: "asc" } } } });
  if (!acc) return NextResponse.json({ error: "not found" }, { status: 404 });
  let bal = 0;
  const rows = acc.transactions.map((t) => {
    if (t.type === "DEPOSIT" || t.type === "ADJUSTMENT") bal += t.amount; else bal -= t.amount;
    return { ts: t.createdAt, type: t.type, amount: t.amount, bal };
  });
  const Doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Buku Tabungan</Text>
        <Text>Siswa: {acc.student.user?.name ?? acc.studentId}</Text>
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
  return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename=book_${acc.id}.pdf` } });
}
