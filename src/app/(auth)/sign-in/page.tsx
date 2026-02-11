import SignInForm from "./sign-in-form";
import { prisma } from "@/lib/prisma";
import { s3, S3_BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Suspense } from "react";

export default async function SignInPage() {
  const profile = await prisma.schoolProfile.findFirst();
  let logoSignedUrl: string | undefined;
  if (profile?.logoUrl) {
    if (/^https?:\/\//i.test(profile.logoUrl)) logoSignedUrl = profile.logoUrl;
    else {
      try {
        const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: profile.logoUrl });
        logoSignedUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      } catch {}
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            {logoSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSignedUrl} alt="Logo Sekolah" className="h-12 w-12 rounded-md object-contain bg-white/60" />
            ) : (
              <span className="text-2xl">🏫</span>
            )}
          </div>
          <div className="text-lg font-semibold">{profile?.name || "Sistem Informasi Sekolah"}</div>
        </div>
        <Suspense fallback={<div className="text-sm text-muted-foreground text-center">Memuat form login...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
