import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12 },
  title: { fontSize: 16, marginBottom: 8, fontWeight: 700 },
  section: { marginTop: 12 },
  row: { flexDirection: "row", borderBottom: "1px solid #ccc" },
  cellH: { flexGrow: 1, padding: 6, fontWeight: 700, backgroundColor: "#f5f5f5" },
  cell: { flexGrow: 1, padding: 6 },
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rc = await prisma.reportCard.findUnique({
    where: { id },
    include: { student: { include: { user: true } }, classroom: true, academicYear: true, semester: true },
  });
  if (!rc) return NextResponse.json({ error: "not found" }, { status: 404 });

  const assessments = await prisma.assessment.findMany({
    where: { studentId: rc.studentId, classroomId: rc.classroomId, academicYearId: rc.academicYearId },
    include: { subject: true },
  });

  const bySubject = new Map<string, { name: string; sum: number; wsum: number }>();
  for (const a of assessments) {
    const subName = a.subject?.name ?? a.subjectId;
    const w = a.weight ?? 1;
    const cur = bySubject.get(a.subjectId) || { name: subName, sum: 0, wsum: 0 };
    cur.sum += a.score * w;
    cur.wsum += w;
    bySubject.set(a.subjectId, cur);
  }
  const rows = Array.from(bySubject.values()).map((r) => ({ name: r.name, avg: r.wsum > 0 ? r.sum / r.wsum : 0 }));

  const Doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Raport Siswa</Text>
        <Text>Nama: {rc.student.user?.name ?? rc.studentId}</Text>
        <Text>Kelas: {rc.classroom.name}</Text>
        <Text>Tahun Ajaran: {rc.academicYear.name}</Text>
        <Text>Semester: {rc.semester.name}</Text>
        <Text>Nilai Akhir: {typeof rc.overallScore === "number" ? rc.overallScore.toFixed(2) : "-"}</Text>
        {rc.remarks ? <Text>Keterangan: {rc.remarks}</Text> : null}

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={[styles.cellH, { flexBasis: "70%" }]}>Mata Pelajaran</Text>
            <Text style={[styles.cellH, { flexBasis: "30%" }]}>Rata-rata</Text>
          </View>
          {rows.map((r, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={[styles.cell, { flexBasis: "70%" }]}>{r.name}</Text>
              <Text style={[styles.cell, { flexBasis: "30%" }]}>{r.avg.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const buf = await renderToBuffer(Doc);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=report_${rc.studentId}_${rc.semester.name}.pdf`,
    },
  });
}
