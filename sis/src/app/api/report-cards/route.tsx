import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportCardGenerateSchema, reportCardQuerySchema } from "@/lib/schemas/assessment";
import { getToken } from "next-auth/jwt";
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { s3, S3_BUCKET } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const parse = reportCardQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });
  const { page, pageSize, classroomId, semesterId, studentId } = parse.data;
  const where: Record<string, unknown> = {};
  if (classroomId) (where as any).classroomId = classroomId;
  if (semesterId) (where as any).semesterId = semesterId;
  if (studentId) (where as any).studentId = studentId;
  const [items, total] = await Promise.all([
    prisma.reportCard.findMany({
      where,
      include: { student: { include: { user: true } }, classroom: true, academicYear: true, semester: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.reportCard.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const perms = (token as any)?.permissions as string[] | undefined;
  const roles = (token as any)?.roles as string[] | undefined;
  const allowed = Boolean(perms?.includes("report.approve") || roles?.includes("admin"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = reportCardGenerateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { classroomId, semesterId, remarks } = parsed.data;

  const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
  if (!semester) return NextResponse.json({ error: "semester not found" }, { status: 404 });
  const academicYearId = semester.academicYearId;

  // find enrolled students in classroom & AY
  const enrolls = await prisma.enrollment.findMany({ where: { classroomId, academicYearId, active: true }, include: { student: true } });
  if (!enrolls.length) return NextResponse.json({ error: "no enrollments" }, { status: 400 });

  const results = await prisma.$transaction(async (tx) => {
    const created: string[] = [];
    for (const e of enrolls) {
      const assessments = await tx.assessment.findMany({ where: { studentId: e.studentId, classroomId, academicYearId } });
      let overall: number | null = null;
      if (assessments.length) {
        const sumWeight = assessments.reduce((acc, a) => acc + (a.weight ?? 1), 0);
        const sumScore = assessments.reduce((acc, a) => acc + (a.score * (a.weight ?? 1)), 0);
        overall = sumWeight > 0 ? sumScore / sumWeight : null;
      }
      const existing = await tx.reportCard.findFirst({ where: { studentId: e.studentId, classroomId, academicYearId, semesterId } });
      let id: string;
      if (existing) {
        await tx.reportCard.update({ where: { id: existing.id }, data: { overallScore: overall ?? undefined, remarks: remarks ?? undefined } });
        id = existing.id;
      } else {
        const createdRc = await tx.reportCard.create({ data: { studentId: e.studentId, classroomId, academicYearId, semesterId, overallScore: overall ?? undefined, remarks: remarks ?? undefined } });
        id = createdRc.id;
      }
      created.push(id);
    }
    return created;
  });

  // After DB ops, generate PDF per report and upload to S3
  const styles = StyleSheet.create({
    page: { padding: 24, fontSize: 12 },
    title: { fontSize: 16, marginBottom: 8, fontWeight: 700 },
    section: { marginTop: 12 },
    row: { flexDirection: "row", borderBottom: "1px solid #ccc" },
    cellH: { flexGrow: 1, padding: 6, fontWeight: 700, backgroundColor: "#f5f5f5" },
    cell: { flexGrow: 1, padding: 6 },
  });

  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "");
  const urls: Record<string, string> = {};
  const { renderToBuffer } = await import("@react-pdf/renderer");

  for (const id of results) {
    try {
      const rc = await prisma.reportCard.findUnique({
        where: { id },
        include: { student: { include: { user: true } }, classroom: true, academicYear: true, semester: true },
      });
      if (!rc) continue;
      const assessments = await prisma.assessment.findMany({ where: { studentId: rc.studentId, classroomId: rc.classroomId, academicYearId: rc.academicYearId }, include: { subject: true } });
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

      const buf = await renderToBuffer(Doc);
      const key = `reports/${id}.pdf`;
      await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: buf, ContentType: "application/pdf" }));
      const url = endpoint ? `${endpoint}/${S3_BUCKET}/${key}` : key;
      urls[id] = url;
      await prisma.reportCard.update({ where: { id }, data: { pdfUrl: url } });
    } catch (e) {
      // continue on error for individual PDF
      // eslint-disable-next-line no-console
      console.error("PDF upload failed", id, e);
    }
  }

  return NextResponse.json({ ok: true, ids: results, pdfs: urls });
}
