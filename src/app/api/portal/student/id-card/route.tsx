/* eslint-disable jsx-a11y/alt-text */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { s3, S3_BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { resolvePortalStudentContext } from "@/server/portal/student-context";

export const runtime = "nodejs";

function mmToPt(mm: number) { return (mm / 25.4) * 72; }

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestedStudentId = req.nextUrl.searchParams.get("childId");
  const { studentId, academicYearId } = await resolvePortalStudentContext(userId, requestedStudentId);
  if (!studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [student, school, activeYear] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, include: { user: true } }),
    prisma.schoolProfile.findFirst({}),
    prisma.academicYear.findFirst({ where: { isActive: true }, orderBy: { startDate: "desc" } }),
  ]);
  if (!student?.user) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, active: true, ...(academicYearId ? { academicYearId } : activeYear ? { academicYearId: activeYear.id } : {}) },
    include: { classroom: { include: { grade: true, academicYear: true } } },
    orderBy: { enrolledAt: "desc" },
  });

  // presign logo if needed
  let logoUrl: string | undefined;
  if (school?.logoUrl) {
    if (/^https?:\/\//i.test(school.logoUrl)) logoUrl = school.logoUrl;
    else {
      try {
        const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: school.logoUrl });
        logoUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      } catch {}
    }
  }

  const styles = StyleSheet.create({
    page: {
      width: mmToPt(85.6), // CR-80 width
      height: mmToPt(54),  // CR-80 height
      padding: 10,
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      fontSize: 9,
    },
    row: { flexDirection: "row" },
    col: { flexDirection: "column", flexGrow: 1 },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    logo: { width: 24, height: 24, marginRight: 6 },
    title: { fontSize: 10, fontWeight: 700 },
    sub: { color: "#6b7280" },
    sep: { borderBottom: "1px solid #e5e7eb", marginVertical: 4 },
    label: { color: "#6b7280" },
    value: { fontWeight: 700 },
    footer: { position: "absolute", bottom: 8, left: 10, right: 10, flexDirection: "row", justifyContent: "space-between", color: "#6b7280" },
  });

  // Build verification URL and QR image URL (using external provider by default)
  const base = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const verifyUrl = `${base}/student/${student.id}`;
  const qrProvider = process.env.QR_PROVIDER_URL || "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=";
  const qrUrl = `${qrProvider}${encodeURIComponent(verifyUrl)}`;

  // Student photo presign (optional)
  let photoUrl: string | undefined;
  if (student.photoUrl) {
    if (/^https?:\/\//i.test(student.photoUrl)) photoUrl = student.photoUrl;
    else {
      try {
        const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: student.photoUrl });
        photoUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      } catch {}
    }
  }

  const Doc = (
    <Document>
      <Page size={{ width: mmToPt(85.6), height: mmToPt(54) }} style={styles.page}>
        <View style={styles.header}>
          {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
          <View>
            <Text style={styles.title}>{school?.name || "Sekolah"}</Text>
            {school?.address ? <Text style={styles.sub}>{school.address}</Text> : null}
          </View>
        </View>
        <View style={styles.sep} />
        <View style={{ gap: 2, flexDirection: "row" }}>
          <View style={{ width: 42, marginRight: 6 }}>
            {photoUrl ? <Image src={photoUrl} style={{ width: 42, height: 56, border: "1px solid #e5e7eb" }} /> : <View style={{ width: 42, height: 56, backgroundColor: "#f3f4f6" }} />}
          </View>
          <View style={{ gap: 2, flexGrow: 1 }}>
            <Text><Text style={styles.label}>Nama:</Text> <Text style={styles.value}>{student.user.name || student.user.email}</Text></Text>
            {student.nis ? <Text><Text style={styles.label}>NIS:</Text> <Text style={styles.value}>{student.nis}</Text></Text> : null}
            {student.nisn ? <Text><Text style={styles.label}>NISN:</Text> <Text style={styles.value}>{student.nisn}</Text></Text> : null}
            {enrollment?.classroom?.name ? <Text><Text style={styles.label}>Kelas:</Text> <Text style={styles.value}>{enrollment.classroom.name}</Text></Text> : null}
          </View>
          <View>
            <Image src={qrUrl} style={{ width: 42, height: 42 }} />
          </View>
        </View>
        <View style={styles.footer}>
          <Text>ID: {student.id.slice(0, 8)}</Text>
          <Text>TA {enrollment?.classroom?.academicYear?.name || activeYear?.name || "-"}</Text>
        </View>
      </Page>
    </Document>
  );

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const buf = await renderToBuffer(Doc);
  return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename=student_id_${student.id}.pdf` } });
}
