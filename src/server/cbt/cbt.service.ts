import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { writeAuditEvent } from "@/server/audit";
import type {
  CbtAttemptSubmitInput,
  CbtExamCreateInput,
  CbtExamListQueryInput,
  CbtQuestionCreateInput,
} from "./cbt.dto";

export class CbtServiceError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

function serializeOptions(options: string[] | undefined) {
  return options ? JSON.stringify(options) : null;
}

function parseOptions(options: string | null) {
  if (!options) return null;
  try {
    const parsed = JSON.parse(options) as unknown;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeAnswer(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function examWindowWhere(now: Date): Prisma.ExamWhereInput {
  return {
    AND: [
      { OR: [{ startAt: null }, { startAt: { lte: now } }] },
      { OR: [{ endAt: null }, { endAt: { gte: now } }] },
    ],
  };
}

export async function listCbtExams(query: CbtExamListQueryInput) {
  const { page, pageSize, q, classroomId, subjectId, activeOnly } = query;
  const where: Prisma.ExamWhereInput = {
    ...(classroomId ? { classroomId } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(activeOnly ? examWindowWhere(new Date()) : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      include: {
        classroom: true,
        subject: true,
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: [{ startAt: "desc" }, { title: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.exam.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function createCbtExam(input: CbtExamCreateInput, actorId: string) {
  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.exam.create({
      data: {
        title: input.title,
        subjectId: input.subjectId ?? null,
        classroomId: input.classroomId ?? null,
        startAt: input.startAt ?? null,
        endAt: input.endAt ?? null,
      },
    });

    await writeAuditEvent(tx, {
      actorId,
      type: "cbt.exam.create",
      entity: "Exam",
      entityId: item.id,
      meta: { title: item.title, classroomId: item.classroomId, subjectId: item.subjectId },
    });

    return item;
  });

  return created;
}

export async function listCbtQuestions(examId: string) {
  const items = await prisma.examQuestion.findMany({
    where: { examId },
    orderBy: { id: "asc" },
  });
  return {
    items: items.map((item) => ({
      ...item,
      optionsJson: item.options,
      options: parseOptions(item.options),
      answer: item.answer ? "***" : null,
    })),
  };
}

export async function createCbtQuestion(examId: string, input: CbtQuestionCreateInput, actorId: string) {
  const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { id: true } });
  if (!exam) throw new CbtServiceError("Exam not found", 404);

  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.examQuestion.create({
      data: {
        examId,
        text: input.text,
        options: serializeOptions(input.options),
        answer: input.answer ?? null,
      },
    });

    await writeAuditEvent(tx, {
      actorId,
      type: "cbt.question.create",
      entity: "ExamQuestion",
      entityId: item.id,
      meta: { examId },
    });

    return item;
  });

  return { ...created, options: parseOptions(created.options), optionsJson: created.options, answer: created.answer ? "***" : null };
}

export async function listAvailablePortalCbtExams(input: { studentId: string; classroomId: string | null }) {
  const now = new Date();
  const where: Prisma.ExamWhereInput = {
    ...examWindowWhere(now),
    OR: [
      { classroomId: null },
      ...(input.classroomId ? [{ classroomId: input.classroomId }] : []),
    ],
  };

  const exams = await prisma.exam.findMany({
    where,
    include: {
      subject: true,
      classroom: true,
      questions: { select: { id: true } },
      attempts: {
        where: { studentId: input.studentId },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ startAt: "asc" }, { title: "asc" }],
    take: 50,
  });

  return {
    items: exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      subject: exam.subject ? { id: exam.subject.id, name: exam.subject.name } : null,
      classroom: exam.classroom ? { id: exam.classroom.id, name: exam.classroom.name } : null,
      startAt: exam.startAt,
      endAt: exam.endAt,
      questionCount: exam.questions.length,
      latestAttempt: exam.attempts[0] ?? null,
    })),
  };
}

export async function startOrSubmitPortalCbtAttempt(input: {
  examId: string;
  studentId: string;
  classroomId: string | null;
  payload: CbtAttemptSubmitInput;
}) {
  const now = new Date();
  const exam = await prisma.exam.findFirst({
    where: {
      id: input.examId,
      ...examWindowWhere(now),
      OR: [
        { classroomId: null },
        ...(input.classroomId ? [{ classroomId: input.classroomId }] : []),
      ],
    },
    include: { questions: true },
  });
  if (!exam) throw new CbtServiceError("Exam not available", 404);

  const activeAttempt =
    (await prisma.examAttempt.findFirst({
      where: { examId: input.examId, studentId: input.studentId, endedAt: null },
      orderBy: { startedAt: "desc" },
    })) ??
    (await prisma.examAttempt.create({
      data: { examId: input.examId, studentId: input.studentId },
    }));

  if (!input.payload.answers) {
    return {
      attempt: activeAttempt,
      questions: exam.questions.map((question) => ({
        id: question.id,
        examId: question.examId,
        text: question.text,
        options: parseOptions(question.options),
      })),
    };
  }

  const answerEntries = Object.entries(input.payload.answers);
  const answersByQuestion = new Map(answerEntries);
  const answerableQuestions = exam.questions.filter((question) => question.answer);
  const correct = answerableQuestions.reduce((count, question) => {
    return count + (normalizeAnswer(answersByQuestion.get(question.id)) === normalizeAnswer(question.answer) ? 1 : 0);
  }, 0);
  const score = answerableQuestions.length > 0 ? (correct / answerableQuestions.length) * 100 : null;

  const updated = await prisma.examAttempt.update({
    where: { id: activeAttempt.id },
    data: {
      answersJson: JSON.stringify(input.payload.answers),
      score,
      endedAt: new Date(),
    },
  });

  return { attempt: updated, grading: { correct, total: answerableQuestions.length, score } };
}
