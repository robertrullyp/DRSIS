import { createHmac, timingSafeEqual } from "crypto";

type CmsPostPreviewPayload = {
  postId: string;
  exp: number;
};

const DEFAULT_PREVIEW_TTL_SECONDS = 60 * 30;

function getPreviewSecret() {
  const secret = process.env.CMS_PREVIEW_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("CMS preview secret is not configured. Set CMS_PREVIEW_SECRET or NEXTAUTH_SECRET.");
  }
  return secret;
}

function signPayload(payloadBase64: string) {
  return createHmac("sha256", getPreviewSecret()).update(payloadBase64).digest("base64url");
}

export function createCmsPostPreviewToken(postId: string, ttlSeconds = DEFAULT_PREVIEW_TTL_SECONDS) {
  const payload: CmsPostPreviewPayload = {
    postId,
    exp: Date.now() + ttlSeconds * 1000,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function readCmsPostPreviewToken(token: string): CmsPostPreviewPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<CmsPostPreviewPayload>;
    if (!parsed || typeof parsed.postId !== "string" || typeof parsed.exp !== "number") {
      return null;
    }
    if (parsed.exp < Date.now()) {
      return null;
    }

    return {
      postId: parsed.postId,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}
