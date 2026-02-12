import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import {
  buildReconciliationReport,
  csvCell,
  resolveFinanceRange,
} from "@/server/finance/reports";

export const runtime = "nodejs";

function moneyIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function htmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  title: { fontSize: 16, marginBottom: 6, fontWeight: 700 },
  subtitle: { fontSize: 10, marginBottom: 12, color: "#666" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    borderBottomStyle: "solid",
    paddingBottom: 4,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderBottomStyle: "solid",
  },
  cell: { paddingVertical: 3, paddingHorizontal: 2 },
  code: { width: 55 },
  name: { flexGrow: 1 },
  num: { width: 78, textAlign: "right" },
  totals: { marginTop: 8, fontSize: 11, fontWeight: 700 },
});

export async function GET(req: NextRequest) {
  try {
    const range = resolveFinanceRange(req.nextUrl.searchParams);
    const cashBankAccountId =
      req.nextUrl.searchParams.get("cashBankAccountId") || undefined;
    const format = (req.nextUrl.searchParams.get("format") || "csv").toLowerCase();

    const report = await buildReconciliationReport(prisma, {
      start: range.start,
      end: range.end,
      cashBankAccountId,
    });

    if (format === "csv") {
      const header = [
        "Code",
        "Name",
        "Type",
        "OpeningConfigured",
        "OpeningAtStart",
        "PeriodInflow",
        "PeriodOutflow",
        "PeriodNet",
        "ClosingAtEndRange",
        "LedgerBalanceCurrent",
        "BalanceSnapshot",
        "VarianceCurrent",
      ].join(",");

      const lines = report.rows.map((row) =>
        [
          csvCell(row.code),
          csvCell(row.name),
          csvCell(row.type),
          row.openingConfigured,
          row.openingAtStart,
          row.periodInflow,
          row.periodOutflow,
          row.periodNet,
          row.closingAtEndRange,
          row.ledgerBalanceCurrent,
          row.balanceSnapshot,
          row.varianceCurrent,
        ].join(","),
      );

      const csv = `\uFEFF${[header, ...lines].join("\n")}`;
      const filename = `cash_reconciliation_${range.startStr}_to_${range.endStr}.csv`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=${filename}`,
        },
      });
    }

    if (format === "xls") {
      const filename = `cash_reconciliation_${range.startStr}_to_${range.endStr}.xls`;
      const headCells = [
        "Code",
        "Name",
        "Type",
        "OpeningConfigured",
        "OpeningAtStart",
        "PeriodInflow",
        "PeriodOutflow",
        "PeriodNet",
        "ClosingAtEndRange",
        "LedgerBalanceCurrent",
        "BalanceSnapshot",
        "VarianceCurrent",
      ];

      const bodyRows = report.rows
        .map((row) => {
          const cells = [
            row.code,
            row.name,
            row.type,
            String(row.openingConfigured),
            String(row.openingAtStart),
            String(row.periodInflow),
            String(row.periodOutflow),
            String(row.periodNet),
            String(row.closingAtEndRange),
            String(row.ledgerBalanceCurrent),
            String(row.balanceSnapshot),
            String(row.varianceCurrent),
          ];
          return `<tr>${cells.map((c) => `<td>${htmlEscape(c)}</td>`).join("")}</tr>`;
        })
        .join("");

      const html = `\uFEFF<!doctype html><html><head><meta charset="utf-8" /></head><body>
<h3>Rekonsiliasi Kas/Bank</h3>
<p>Periode: ${htmlEscape(range.startStr)} s/d ${htmlEscape(range.endStr)}</p>
<table border="1" cellpadding="4" cellspacing="0">
  <thead><tr>${headCells.map((c) => `<th>${htmlEscape(c)}</th>`).join("")}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
</body></html>`;

      return new NextResponse(html, {
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename=${filename}`,
        },
      });
    }

    if (format === "pdf") {
      const filename = `cash_reconciliation_${range.startStr}_to_${range.endStr}.pdf`;

      const Doc = (
        <Document>
          <Page size="A4" style={styles.page}>
            <Text style={styles.title}>Rekonsiliasi Kas/Bank</Text>
            <Text style={styles.subtitle}>
              Periode: {range.startStr} s/d {range.endStr}
            </Text>

            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.code]}>Code</Text>
              <Text style={[styles.cell, styles.name]}>Name</Text>
              <Text style={[styles.cell, styles.num]}>Opening</Text>
              <Text style={[styles.cell, styles.num]}>In</Text>
              <Text style={[styles.cell, styles.num]}>Out</Text>
              <Text style={[styles.cell, styles.num]}>Closing</Text>
              <Text style={[styles.cell, styles.num]}>Snapshot</Text>
              <Text style={[styles.cell, styles.num]}>Variance</Text>
            </View>

            {report.rows.map((row) => (
              <View key={row.id} style={styles.row}>
                <Text style={[styles.cell, styles.code]}>{row.code}</Text>
                <Text style={[styles.cell, styles.name]}>{row.name}</Text>
                <Text style={[styles.cell, styles.num]}>{moneyIdr(row.openingAtStart)}</Text>
                <Text style={[styles.cell, styles.num]}>{moneyIdr(row.periodInflow)}</Text>
                <Text style={[styles.cell, styles.num]}>{moneyIdr(row.periodOutflow)}</Text>
                <Text style={[styles.cell, styles.num]}>{moneyIdr(row.closingAtEndRange)}</Text>
                <Text style={[styles.cell, styles.num]}>{moneyIdr(row.balanceSnapshot)}</Text>
                <Text style={[styles.cell, styles.num]}>{moneyIdr(row.varianceCurrent)}</Text>
              </View>
            ))}

            <Text style={styles.totals}>
              Total Variance: {moneyIdr(report.totals.varianceCurrent)}
            </Text>
          </Page>
        </Document>
      );

      const { renderToBuffer } = await import("@react-pdf/renderer");
      const buf = await renderToBuffer(Doc);

      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=${filename}`,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Use format=csv|xls|pdf" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to export reconciliation report",
      },
      { status: 400 },
    );
  }
}

