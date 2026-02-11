import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { s3, S3_BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET() {
  const profile = await prisma.schoolProfile.findFirst({});
  if (!profile) return NextResponse.json(null);

  let logoSignedUrl: string | undefined;
  const key = profile.logoUrl ?? undefined;
  if (key) {
    if (/^https?:\/\//i.test(key)) {
      logoSignedUrl = key;
    } else {
      try {
        const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
        logoSignedUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      } catch {
        // ignore presign error; keep undefined
      }
    }
  }

  return NextResponse.json({
    id: profile.id,
    name: profile.name,
    npsn: profile.npsn,
    address: profile.address,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    principal: profile.principal,
    accreditation: profile.accreditation,
    motto: profile.motto,
    vision: profile.vision,
    mission: profile.mission,
    logoUrl: profile.logoUrl,
    logoSignedUrl,
  });
}

