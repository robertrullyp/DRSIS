import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { s3, S3_BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function StudentPublicVerify({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id }, include: { user: true, enrollments: { orderBy: { enrolledAt: "desc" }, include: { classroom: { include: { academicYear: true } } } } } });
  if (!student) {
    return (
      <div className="min-h-[60vh] p-6 flex items-center justify-center">
        <div className="rounded-xl p-6 glass-card text-center">
          <div className="text-xl font-semibold mb-2">Data tidak ditemukan</div>
          <Link className="text-accent underline" href="/">Kembali</Link>
        </div>
      </div>
    );
  }
  const current = student.enrollments?.[0];
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
  const name = student.user?.name ?? student.user?.email ?? student.id;
  return (
    <div className="min-h-[60vh] p-6 flex items-center justify-center">
      <div className="rounded-xl p-6 glass-card w-full max-w-lg">
        <div className="text-xl font-semibold mb-1">Verifikasi Siswa</div>
        <div className="text-sm text-muted-foreground mb-4">Halaman ini menampilkan ringkasan identitas siswa yang dipindai melalui QR pada kartu.</div>
        <div className="grid grid-cols-3 gap-3 items-start">
          <div className="col-span-1">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Foto" className="w-full rounded object-cover bg-white" />
            ) : (
              <div className="w-full aspect-[3/4] rounded bg-muted" />
            )}
          </div>
          <div className="col-span-2 space-y-1">
            <div><span className="text-xs text-muted-foreground">Nama:</span> <span className="font-medium">{name}</span></div>
            {student.nis ? <div><span className="text-xs text-muted-foreground">NIS:</span> <span className="font-medium">{student.nis}</span></div> : null}
            {student.nisn ? <div><span className="text-xs text-muted-foreground">NISN:</span> <span className="font-medium">{student.nisn}</span></div> : null}
            {current?.classroom?.name ? <div><span className="text-xs text-muted-foreground">Kelas:</span> <span className="font-medium">{current.classroom.name}</span></div> : null}
            {current?.classroom?.academicYear?.name ? <div><span className="text-xs text-muted-foreground">Tahun Ajaran:</span> <span className="font-medium">{current.classroom.academicYear.name}</span></div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
