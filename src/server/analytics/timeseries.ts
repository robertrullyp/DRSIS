import { prisma } from "@/lib/prisma";

const STUDENT_STATUSES = ["PRESENT", "EXCUSED", "SICK", "ABSENT", "LATE"] as const;
export type StudentAttendanceStatus = (typeof STUDENT_STATUSES)[number];

const STAFF_STATUSES = ["PRESENT", "LEAVE", "SICK", "ABSENT", "LATE"] as const;
export type StaffAttendanceStatus = (typeof STAFF_STATUSES)[number];

const OPERATIONAL_KINDS = ["INCOME", "EXPENSE", "TRANSFER_IN", "TRANSFER_OUT"] as const;
export type OperationalTxnKind = (typeof OPERATIONAL_KINDS)[number];

export type AnalyticsTimeseries = {
  ts: string;
  days: string[];
  attendance: {
    staff: {
      total: number[];
      byStatus: Record<StaffAttendanceStatus, number[]>;
    };
    students: {
      total: number[];
      byStatus: Record<StudentAttendanceStatus, number[]>;
    };
  };
  ppdb: {
    created: number[];
  };
  financeOperational: {
    income: number[];
    expense: number[];
    transferIn: number[];
    transferOut: number[];
    net: number[];
  };
};

function dateOnlyUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(d: Date, days: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}

function clampDays(days: number) {
  if (!Number.isFinite(days)) return 14;
  return Math.max(7, Math.min(90, Math.trunc(days)));
}

function formatDayUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

function emptySeries<K extends string>(keys: readonly K[], length: number) {
  const out = {} as Record<K, number[]>;
  for (const k of keys) out[k] = new Array(length).fill(0);
  return out;
}

export async function getAnalyticsTimeseries(daysInput: number): Promise<AnalyticsTimeseries> {
  const daysCount = clampDays(daysInput);
  const now = new Date();
  const endExclusive = addDaysUTC(dateOnlyUTC(now), 1);
  const startInclusive = addDaysUTC(endExclusive, -daysCount);

  const days: string[] = [];
  for (let i = 0; i < daysCount; i += 1) {
    days.push(formatDayUTC(addDaysUTC(startInclusive, i)));
  }
  const indexByDay = new Map<string, number>(days.map((d, i) => [d, i]));

  const [staffAgg, studentAgg, ppdbRows, opTxns] = await Promise.all([
    prisma.staffAttendance.groupBy({
      by: ["date", "status"],
      where: { date: { gte: startInclusive, lt: endExclusive } },
      _count: { _all: true },
    }),
    prisma.studentAttendance.groupBy({
      by: ["date", "status"],
      where: { date: { gte: startInclusive, lt: endExclusive } },
      _count: { _all: true },
    }),
    prisma.admissionApplication.findMany({
      where: { createdAt: { gte: startInclusive, lt: endExclusive } },
      select: { createdAt: true },
    }),
    prisma.operationalTxn.findMany({
      where: { txnDate: { gte: startInclusive, lt: endExclusive }, approvalStatus: "APPROVED" },
      select: { txnDate: true, kind: true, amount: true },
    }),
  ]);

  const staffByStatus = emptySeries(STAFF_STATUSES, daysCount);
  const staffTotal = new Array(daysCount).fill(0);
  for (const row of staffAgg) {
    const day = formatDayUTC(row.date);
    const idx = indexByDay.get(day);
    if (idx == null) continue;
    const status = row.status as StaffAttendanceStatus;
    if (!STAFF_STATUSES.includes(status)) continue;
    const n = row._count._all ?? 0;
    staffByStatus[status][idx] += n;
    staffTotal[idx] += n;
  }

  const studentByStatus = emptySeries(STUDENT_STATUSES, daysCount);
  const studentTotal = new Array(daysCount).fill(0);
  for (const row of studentAgg) {
    const day = formatDayUTC(row.date);
    const idx = indexByDay.get(day);
    if (idx == null) continue;
    const status = row.status as StudentAttendanceStatus;
    if (!STUDENT_STATUSES.includes(status)) continue;
    const n = row._count._all ?? 0;
    studentByStatus[status][idx] += n;
    studentTotal[idx] += n;
  }

  const ppdbCreated = new Array(daysCount).fill(0);
  for (const row of ppdbRows) {
    const day = formatDayUTC(row.createdAt);
    const idx = indexByDay.get(day);
    if (idx == null) continue;
    ppdbCreated[idx] += 1;
  }

  const income = new Array(daysCount).fill(0);
  const expense = new Array(daysCount).fill(0);
  const transferIn = new Array(daysCount).fill(0);
  const transferOut = new Array(daysCount).fill(0);
  for (const row of opTxns) {
    const day = formatDayUTC(row.txnDate);
    const idx = indexByDay.get(day);
    if (idx == null) continue;
    const kind = row.kind as OperationalTxnKind;
    if (!OPERATIONAL_KINDS.includes(kind)) continue;
    const amt = row.amount ?? 0;
    if (kind === "INCOME") income[idx] += amt;
    else if (kind === "EXPENSE") expense[idx] += amt;
    else if (kind === "TRANSFER_IN") transferIn[idx] += amt;
    else if (kind === "TRANSFER_OUT") transferOut[idx] += amt;
  }

  const net = income.map((v, i) => v - expense[i]);

  return {
    ts: now.toISOString(),
    days,
    attendance: {
      staff: { total: staffTotal, byStatus: staffByStatus },
      students: { total: studentTotal, byStatus: studentByStatus },
    },
    ppdb: { created: ppdbCreated },
    financeOperational: { income, expense, transferIn, transferOut, net },
  };
}
