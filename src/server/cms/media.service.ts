import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";
import { S3_BUCKET, s3 } from "@/lib/s3";
import type {
  CmsMediaCreateInput,
  CmsMediaListQueryInput,
  CmsMediaPresignInput,
  CmsMediaUpdateInput,
} from "@/server/cms/dto/media.dto";
import { CmsServiceError } from "@/server/cms/page.service";
import { writeAuditEvent } from "@/server/audit";

const MEDIA_READ_EXPIRES_SECONDS = 600;
const MEDIA_UPLOAD_EXPIRES_SECONDS = 300;

function normalizeFilename(filename: string) {
  const base = filename
    .trim()
    .replace(/\\/g, "/")
    .split("/")
    .pop() || "file";

  return base
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "") || "file";
}

function modulePrefix(moduleName: "posts" | "galleries" | "pages" | "events") {
  return `cms/${moduleName}`;
}

function resolveMediaUrl(key: string) {
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "");
  if (!endpoint) return null;
  return `${endpoint}/${S3_BUCKET}/${key}`;
}

function parseModuleFromKey(key: string) {
  const parts = key.split("/");
  if (parts.length < 2) return null;
  const prefix = `${parts[0]}/${parts[1]}`;
  return ["cms/posts", "cms/galleries", "cms/pages", "cms/events"].includes(prefix) ? prefix : null;
}

export async function listCmsMedia(query: CmsMediaListQueryInput) {
  const { page, pageSize, q, module } = query;
  const selectedModule = module ? modulePrefix(module) : null;

  const where = {
    ...(selectedModule ? { module: selectedModule } : {}),
    ...(q
      ? {
          OR: [
            { filename: { contains: q } },
            { title: { contains: q } },
            { alt: { contains: q } },
            { key: { contains: q } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.cmsMedia.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cmsMedia.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      previewPath: `/api/admin/cms/media/${item.id}/file`,
      publicPath: `/api/public/cms/media/${item.id}`,
    })),
    total,
    page,
    pageSize,
  };
}

export async function createCmsMediaPresignedUpload(input: CmsMediaPresignInput) {
  const prefix = modulePrefix(input.module);
  const normalized = normalizeFilename(input.filename);
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
  const key = `${prefix}/${datePrefix}/${crypto.randomUUID()}-${normalized}`;

  const cmd = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: input.contentType ?? "application/octet-stream",
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn: MEDIA_UPLOAD_EXPIRES_SECONDS });

  return {
    key,
    url,
    bucket: S3_BUCKET,
    expiresIn: MEDIA_UPLOAD_EXPIRES_SECONDS,
  };
}

export async function createCmsMedia(input: CmsMediaCreateInput, userId: string) {
  const keyModule = parseModuleFromKey(input.key);
  if (!keyModule) {
    throw new CmsServiceError(400, "NOT_FOUND", "Invalid media key module");
  }

  const expectedModule = modulePrefix(input.module);
  if (keyModule !== expectedModule) {
    throw new CmsServiceError(400, "NOT_FOUND", "Media key module mismatch");
  }

  try {
    const created = await prisma.cmsMedia.create({
      data: {
        key: input.key,
        filename: normalizeFilename(input.filename),
        url: resolveMediaUrl(input.key),
        mime: input.mime,
        size: input.size,
        width: input.width,
        height: input.height,
        blurhash: input.blurhash,
        thumbUrl: input.thumbUrl,
        alt: input.alt,
        title: input.title,
        module: expectedModule,
        createdBy: userId,
      },
    });

    await writeAuditEvent(prisma, {
      actorId: userId,
      type: "cms.media.create",
      entity: "CmsMedia",
      entityId: created.id,
      meta: { key: created.key, module: created.module },
    });

    return created;
  } catch {
    throw new CmsServiceError(409, "SLUG_EXISTS", "Media key already registered");
  }
}

export async function getCmsMediaById(id: string) {
  const media = await prisma.cmsMedia.findUnique({ where: { id } });
  if (!media) throw new CmsServiceError(404, "NOT_FOUND", "Media not found");
  return {
    ...media,
    previewPath: `/api/admin/cms/media/${media.id}/file`,
    publicPath: `/api/public/cms/media/${media.id}`,
  };
}

export async function updateCmsMedia(id: string, input: CmsMediaUpdateInput, userId: string) {
  await getCmsMediaById(id);
  const updated = await prisma.cmsMedia.update({
    where: { id },
    data: {
      alt: input.alt === undefined ? undefined : input.alt,
      title: input.title === undefined ? undefined : input.title,
      blurhash: input.blurhash === undefined ? undefined : input.blurhash,
      thumbUrl: input.thumbUrl === undefined ? undefined : input.thumbUrl,
    },
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "cms.media.update",
    entity: "CmsMedia",
    entityId: id,
  });

  return updated;
}

export async function getCmsMediaSignedReadUrl(id: string) {
  const media = await prisma.cmsMedia.findUnique({ where: { id } });
  if (!media) {
    throw new CmsServiceError(404, "NOT_FOUND", "Media not found");
  }

  const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: media.key });
  const url = await getSignedUrl(s3, cmd, { expiresIn: MEDIA_READ_EXPIRES_SECONDS });

  return {
    id: media.id,
    key: media.key,
    mime: media.mime,
    url,
    expiresIn: MEDIA_READ_EXPIRES_SECONDS,
  };
}

export async function getCmsMediaPublicSignedReadUrl(id: string) {
  const media = await prisma.cmsMedia.findUnique({ where: { id } });
  if (!media || !media.key.startsWith("cms/")) {
    throw new CmsServiceError(404, "NOT_FOUND", "Media not found");
  }

  const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: media.key });
  const url = await getSignedUrl(s3, cmd, { expiresIn: MEDIA_READ_EXPIRES_SECONDS });

  return {
    id: media.id,
    key: media.key,
    mime: media.mime,
    url,
    expiresIn: MEDIA_READ_EXPIRES_SECONDS,
  };
}
