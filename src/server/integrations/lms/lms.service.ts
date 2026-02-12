import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import type {
  LmsLinkCreateInput,
  LmsLinkListQueryInput,
  LmsLinkUpdateInput,
  LmsScoreImportInput,
  LmsScoreImportRowInput,
  LmsScoreListQueryInput,
} from "./lms.dto";
import { parseCsvTable } from "./simple-csv";
import { writeAuditEvent } from "@/server/audit";

type LmsServiceErrorCode = "NOT_FOUND" | "BAD_REQUEST";

export class LmsServiceError extends Error {
  status: number;
  code: LmsServiceErrorCode;

  constructor(status: number, code: LmsServiceErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const linkInclude = {
  classroom: { select: { id: true, code: true, name: true } },
  subject: { select: { id: true, code: true, name: true } },
} satisfies Prisma.LmsLinkInclude;

function normalizeOptionalId(value: string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function listLmsLinks(query: LmsLinkListQueryInput) {
  const { page, pageSize, q, external, classroomId, subjectId } = query;

  const where: Prisma.LmsLinkWhereInput = {
    ...(external ? { external } : {}),
    ...(classroomId ? { classroomId } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(q
      ? {
          OR: [
            { external: { contains: q } },
            { externalId: { contains: q } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.lmsLink.findMany({
      where,
      include: linkInclude,
      orderBy: [{ external: "asc" }, { externalId: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lmsLink.count({ where }),
  ]);

  const counts = items.length
    ? await prisma.lmsScore
        .groupBy({
          by: ["linkId"],
          where: { linkId: { in: items.map((item) => item.id) } },
          _count: { _all: true },
        })
        .catch(() => [])
    : [];

  const countMap = new Map<string, number>();
  for (const row of counts) countMap.set(row.linkId, row._count._all);

  const enriched = items.map((item) => ({ ...item, scoreCount: countMap.get(item.id) ?? 0 }));
  return { items: enriched, total, page, pageSize };
}

export async function getLmsLinkById(id: string) {
  const item = await prisma.lmsLink.findUnique({ where: { id }, include: linkInclude });
  if (!item) throw new LmsServiceError(404, "NOT_FOUND", "LMS link not found");

  const scoreCount = await prisma.lmsScore.count({ where: { linkId: id } });
  return { ...item, scoreCount };
}

export async function createLmsLink(input: LmsLinkCreateInput, userId: string) {
  const created = await prisma.lmsLink.create({
    data: {
      external: input.external,
      externalId: input.externalId,
      classroomId: normalizeOptionalId(input.classroomId),
      subjectId: normalizeOptionalId(input.subjectId),
    },
    include: linkInclude,
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "lms.link.create",
    entity: "LmsLink",
    entityId: created.id,
    meta: { external: created.external, externalId: created.externalId },
  });

  return { ...created, scoreCount: 0 };
}

export async function updateLmsLink(id: string, input: LmsLinkUpdateInput, userId: string) {
  await getLmsLinkById(id);

  const updated = await prisma.lmsLink.update({
    where: { id },
    data: {
      ...(typeof input.external === "string" ? { external: input.external } : {}),
      ...(typeof input.externalId === "string" ? { externalId: input.externalId } : {}),
      ...(input.classroomId !== undefined ? { classroomId: normalizeOptionalId(input.classroomId) } : {}),
      ...(input.subjectId !== undefined ? { subjectId: normalizeOptionalId(input.subjectId) } : {}),
    },
    include: linkInclude,
  });

  const scoreCount = await prisma.lmsScore.count({ where: { linkId: id } });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "lms.link.update",
    entity: "LmsLink",
    entityId: id,
    meta: { external: updated.external, externalId: updated.externalId },
  });

  return { ...updated, scoreCount };
}

export async function deleteLmsLink(id: string, userId: string) {
  await getLmsLinkById(id);

  await prisma.$transaction(async (tx) => {
    await tx.lmsScore.deleteMany({ where: { linkId: id } });
    await tx.lmsLink.delete({ where: { id } });
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "lms.link.delete",
    entity: "LmsLink",
    entityId: id,
    meta: null,
  });
}

type LmsScoreRow = {
  id: string;
  studentId: string;
  score: number;
  syncedAt: Date;
  student?: { id: string; nis: string | null; nisn: string | null; name: string | null; email: string };
};

export async function listLmsScores(linkId: string, query: LmsScoreListQueryInput) {
  await getLmsLinkById(linkId);

  const { page, pageSize } = query;
  const [items, total] = await Promise.all([
    prisma.lmsScore.findMany({
      where: { linkId },
      orderBy: [{ syncedAt: "desc" }, { studentId: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lmsScore.count({ where: { linkId } }),
  ]);

  const studentIds = Array.from(new Set(items.map((item) => item.studentId)));
  const students = studentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: {
          id: true,
          nis: true,
          nisn: true,
          user: { select: { name: true, email: true } },
        },
      })
    : [];

  const studentMap = new Map<string, { id: string; nis: string | null; nisn: string | null; name: string | null; email: string }>();
  for (const student of students) {
    studentMap.set(student.id, {
      id: student.id,
      nis: student.nis ?? null,
      nisn: student.nisn ?? null,
      name: student.user?.name ?? null,
      email: student.user?.email ?? "",
    });
  }

  const enriched: LmsScoreRow[] = items.map((item) => ({
    id: item.id,
    studentId: item.studentId,
    score: item.score,
    syncedAt: item.syncedAt,
    student: studentMap.get(item.studentId),
  }));

  return { items: enriched, total, page, pageSize };
}

function mapRowFromCsv(header: string[], row: string[]): LmsScoreImportRowInput {
  const get = (key: string) => {
    const idx = header.indexOf(key);
    return idx >= 0 ? row[idx] : undefined;
  };
  const studentId = get("studentid");
  const nisn = get("nisn");
  const nis = get("nis");
  const email = get("email");
  const scoreRaw = get("score");
  return {
    studentId: studentId || undefined,
    nisn: nisn || undefined,
    nis: nis || undefined,
    email: email || undefined,
    score: scoreRaw ?? "",
  } as unknown as LmsScoreImportRowInput;
}

async function resolveStudents(rows: LmsScoreImportRowInput[]) {
  const directIds = Array.from(new Set(rows.map((row) => row.studentId).filter(Boolean))) as string[];
  const nisns = Array.from(new Set(rows.map((row) => row.nisn).filter(Boolean))) as string[];
  const nises = Array.from(new Set(rows.map((row) => row.nis).filter(Boolean))) as string[];
  const emails = Array.from(new Set(rows.map((row) => row.email).filter(Boolean))) as string[];

  const [directStudents, nisnStudents, nisStudents, usersByEmail] = await Promise.all([
    directIds.length ? prisma.student.findMany({ where: { id: { in: directIds } }, select: { id: true } }) : Promise.resolve([]),
    nisns.length ? prisma.student.findMany({ where: { nisn: { in: nisns } }, select: { id: true, nisn: true } }) : Promise.resolve([]),
    nises.length ? prisma.student.findMany({ where: { nis: { in: nises } }, select: { id: true, nis: true } }) : Promise.resolve([]),
    emails.length ? prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true, email: true } }) : Promise.resolve([]),
  ]);

  const directMap = new Set(directStudents.map((student) => student.id));
  const nisnMap = new Map<string, string>();
  for (const student of nisnStudents) {
    if (!student.nisn) continue;
    nisnMap.set(student.nisn, student.id);
  }

  const nisMap = new Map<string, string>();
  for (const student of nisStudents) {
    if (!student.nis) continue;
    nisMap.set(student.nis, student.id);
  }

  const emailToUserId = new Map<string, string>();
  for (const user of usersByEmail) emailToUserId.set(user.email, user.id);

  const userIds = Array.from(new Set(usersByEmail.map((user) => user.id)));
  const studentsByUser = userIds.length
    ? await prisma.student.findMany({ where: { userId: { in: userIds } }, select: { id: true, userId: true } })
    : [];
  const userToStudentId = new Map<string, string>();
  for (const student of studentsByUser) userToStudentId.set(student.userId, student.id);

  return {
    isDirectKnown: (id: string) => directMap.has(id),
    fromNisn: (nisn: string) => nisnMap.get(nisn) ?? null,
    fromNis: (nis: string) => nisMap.get(nis) ?? null,
    fromEmail: (email: string) => {
      const userId = emailToUserId.get(email);
      if (!userId) return null;
      return userToStudentId.get(userId) ?? null;
    },
  };
}

export async function importLmsScores(linkId: string, input: LmsScoreImportInput, userId: string) {
  await getLmsLinkById(linkId);

  let rows: LmsScoreImportRowInput[] = [];
  if (input.items && input.items.length > 0) {
    rows = input.items;
  } else if (input.csv) {
    const table = parseCsvTable(input.csv);
    if (!table.header.length) throw new LmsServiceError(400, "BAD_REQUEST", "CSV kosong");
    rows = table.rows.map((row) => mapRowFromCsv(table.header, row));
  }

  if (!rows.length) throw new LmsServiceError(400, "BAD_REQUEST", "Tidak ada data untuk diimpor");

  const resolver = await resolveStudents(rows);
  const resolved = new Map<string, number>();
  const errors: Array<{ row: number; reason: string }> = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const score = Number(row.score);
    if (!Number.isFinite(score)) {
      errors.push({ row: i + 1, reason: "Score bukan angka" });
      continue;
    }

    let studentId: string | null = null;
    if (row.studentId) {
      studentId = resolver.isDirectKnown(row.studentId) ? row.studentId : null;
      if (!studentId) {
        errors.push({ row: i + 1, reason: `Student ID tidak ditemukan: ${row.studentId}` });
        continue;
      }
    } else if (row.nisn) {
      studentId = resolver.fromNisn(row.nisn);
      if (!studentId) {
        errors.push({ row: i + 1, reason: `NISN tidak ditemukan: ${row.nisn}` });
        continue;
      }
    } else if (row.nis) {
      studentId = resolver.fromNis(row.nis);
      if (!studentId) {
        errors.push({ row: i + 1, reason: `NIS tidak ditemukan: ${row.nis}` });
        continue;
      }
    } else if (row.email) {
      studentId = resolver.fromEmail(row.email);
      if (!studentId) {
        errors.push({ row: i + 1, reason: `Email tidak ditemukan/tiada student: ${row.email}` });
        continue;
      }
    } else {
      errors.push({ row: i + 1, reason: "Tidak ada kunci identitas student" });
      continue;
    }

    resolved.set(studentId, score);
  }

  const now = new Date();
  const data = Array.from(resolved.entries()).map(([studentId, score]) => ({
    linkId,
    studentId,
    score,
    syncedAt: now,
  }));

  await prisma.$transaction(async (tx) => {
    if (input.mode === "replace_all") {
      await tx.lmsScore.deleteMany({ where: { linkId } });
    } else if (data.length > 0) {
      await tx.lmsScore.deleteMany({ where: { linkId, studentId: { in: data.map((row) => row.studentId) } } });
    }

    if (data.length > 0) {
      await tx.lmsScore.createMany({ data });
    }
  });

  await writeAuditEvent(prisma, {
    actorId: userId,
    type: "lms.score.import",
    entity: "LmsLink",
    entityId: linkId,
    meta: {
      mode: input.mode,
      imported: data.length,
      errors: errors.length,
      at: now.toISOString(),
    },
  });

  return {
    imported: data.length,
    errors,
  };
}
