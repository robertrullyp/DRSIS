import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { summarizeInvoice } from "@/server/finance/invoice-balance";

export const runtime = "nodejs";

const styles = StyleSheet.create({ page: { padding: 24, fontSize: 12 }, title: { fontSize: 16, marginBottom: 8, fontWeight: 700 }, row: { flexDirection: "row" }, cell: { flexGrow: 1, padding: 4 } });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      discounts: true,
      payments: { include: { refunds: true } },
      student: { include: { user: true } },
      academicYear: true,
    },
  });
  if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
  const balance = summarizeInvoice(inv);

  const Doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Kuitansi Pembayaran</Text>
        <Text>Invoice: {inv.code}</Text>
        <Text>Siswa: {inv.student.user?.name ?? inv.studentId}</Text>
        <Text>Tahun Ajaran: {inv.academicYear.name}</Text>
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: 700 }}>Rincian</Text>
          {inv.items.map((it) => (
            <View key={it.id} style={styles.row}>
              <Text style={[styles.cell, { flexBasis: "70%" }]}>{it.name}</Text>
              <Text style={[styles.cell, { flexBasis: "30%" }]}>{it.amount}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: 700 }}>Pembayaran</Text>
          {inv.payments.length === 0 ? (
            <Text>Belum ada pembayaran</Text>
          ) : (
            inv.payments.map((p) => (
              <View key={p.id} style={styles.row}>
                <Text style={[styles.cell, { flexBasis: "50%" }]}>{new Date(p.paidAt).toLocaleString()}</Text>
                <Text style={[styles.cell, { flexBasis: "20%" }]}>{p.method}</Text>
                <Text style={[styles.cell, { flexBasis: "30%" }]}>{p.amount}</Text>
              </View>
            ))
          )}
        </View>
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: 700 }}>Diskon</Text>
          {inv.discounts.length === 0 ? (
            <Text>Tidak ada diskon</Text>
          ) : (
            inv.discounts.map((d) => (
              <View key={d.id} style={styles.row}>
                <Text style={[styles.cell, { flexBasis: "70%" }]}>{d.name}</Text>
                <Text style={[styles.cell, { flexBasis: "30%" }]}>{d.amount}</Text>
              </View>
            ))
          )}
        </View>
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: 700 }}>Refund</Text>
          {inv.payments.flatMap((p) => p.refunds).length === 0 ? (
            <Text>Tidak ada refund</Text>
          ) : (
            inv.payments.flatMap((p) => p.refunds).map((r) => (
              <View key={r.id} style={styles.row}>
                <Text style={[styles.cell, { flexBasis: "70%" }]}>{r.reason || "Refund"}</Text>
                <Text style={[styles.cell, { flexBasis: "30%" }]}>{r.amount}</Text>
              </View>
            ))
          )}
        </View>
        <View style={{ marginTop: 8 }}>
          <Text>Total Kotor: {balance.grossTotal}</Text>
          <Text>Total Diskon: {balance.discountTotal}</Text>
          <Text>Total Tagihan: {balance.netTotal}</Text>
          <Text>Total Pembayaran: {balance.paymentTotal}</Text>
          <Text>Total Refund: {balance.refundTotal}</Text>
          <Text>Terbayar Bersih: {balance.paidNet}</Text>
          <Text>Sisa: {balance.due}</Text>
        </View>
      </Page>
    </Document>
  );

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const buf = await renderToBuffer(Doc);
  return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename=receipt_${inv.code}.pdf` } });
}
