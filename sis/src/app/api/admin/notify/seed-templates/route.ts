import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const waTemplates: Array<{ key: string; content: string }> = [
    { key: "leave.requested", content: "Pengajuan cuti/izin diterima. Periode: {{startDate}} - {{endDate}} ({{days}} hari)." },
    { key: "leave.approved", content: "Pengajuan cuti/izin disetujui. Periode: {{startDate}} - {{endDate}} ({{days}} hari). Tipe: {{type}}." },
    { key: "leave.rejected", content: "Pengajuan cuti/izin ditolak. Periode: {{startDate}} - {{endDate}} ({{days}} hari)." },
  ];
  const emailTemplates: Array<{ key: string; subject: string; content: string }> = [
    { key: "leave.requested", subject: "Pengajuan Cuti/Izin Diterima", content: "<p>Pengajuan cuti/izin Anda telah diterima.<br/>Periode: <b>{{startDate}}</b> - <b>{{endDate}}</b> ({{days}} hari).</p>" },
    { key: "leave.approved", subject: "Pengajuan Cuti/Izin Disetujui", content: "<p>Pengajuan cuti/izin Anda <b>disetujui</b>.<br/>Periode: <b>{{startDate}}</b> - <b>{{endDate}}</b> ({{days}} hari). Tipe: <b>{{type}}</b>.</p>" },
    { key: "leave.rejected", subject: "Pengajuan Cuti/Izin Ditolak", content: "<p>Pengajuan cuti/izin Anda <b>ditolak</b>.<br/>Periode: <b>{{startDate}}</b> - <b>{{endDate}}</b> ({{days}} hari).</p>" },
  ];

  for (const t of waTemplates) {
    await prisma.waTemplate.upsert({ where: { key: t.key }, create: { key: t.key, content: t.content }, update: { content: t.content } });
  }
  for (const t of emailTemplates) {
    await prisma.emailTemplate.upsert({ where: { key: t.key }, create: { key: t.key, subject: t.subject, content: t.content }, update: { subject: t.subject, content: t.content } });
  }
  return NextResponse.json({ ok: true, wa: waTemplates.length, email: emailTemplates.length });
}

