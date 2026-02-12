import { prisma } from "@/lib/prisma";

export type AnalyticsSummary = {
  ts: string;
  users: { total: number };
  academics: { students: number; teachers: number; employees: number };
  attendance: {
    staffToday: { total: number; checkedIn: number };
    studentsToday: { total: number };
  };
  ppdb: {
    total: number;
    byStatus: Record<string, number>;
  };
  library: { activeLoans: number; overdueLoans: number; fineTotal: number };
  assets: { activeLoans: number };
  finance: { openOrPartialInvoices: number; overdueInvoices: number; outstandingAmount: number };
  financeOperationalMtd: { income: number; expense: number; transferIn: number; transferOut: number; net: number };
  notifications: { waPending: number; emailPending: number };
  system: { auditEventsLast24h: number; dapodikQueuePending: number };
};

function toStatusMap(rows: Array<{ status: string; _count: { status: number } }>) {
  const out: Record<string, number> = {};
  for (const row of rows) out[row.status] = row._count.status;
  return out;
}

function dateOnlyUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(d: Date, days: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}

function monthStartUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonthsUTC(d: Date, months: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const now = new Date();
  // Attendance dates are normalized to midnight UTC across the app.
  const todayStart = dateOnlyUTC(now);
  const tomorrowStart = addDaysUTC(todayStart, 1);
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const mtdStart = monthStartUTC(now);
  const nextMonthStart = addMonthsUTC(mtdStart, 1);

  const [
    usersTotal,
    studentsTotal,
    teachersTotal,
    employeesTotal,
    staffTodayTotal,
    staffTodayCheckedIn,
    studentsTodayTotal,
    ppdbTotal,
    ppdbByStatus,
    libraryActiveLoans,
    libraryOverdueLoans,
    libraryFineTotalAgg,
    assetActiveLoans,
    financeOpenOrPartial,
    financeOverdue,
    financeOutstandingAgg,
    financeOperationalMtdAgg,
    waPending,
    emailPending,
    auditEventsLast24h,
    dapodikQueuePending,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.employee.count(),
    prisma.staffAttendance.count({ where: { date: { gte: todayStart, lt: tomorrowStart } } }),
    prisma.staffAttendance.count({
      where: { date: { gte: todayStart, lt: tomorrowStart }, checkInAt: { not: null } },
    }),
    prisma.studentAttendance.count({ where: { date: { gte: todayStart, lt: tomorrowStart } } }),
    prisma.admissionApplication.count(),
    prisma.admissionApplication.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.libLoan.count({ where: { returnedAt: null } }),
    prisma.libLoan.count({ where: { returnedAt: null, dueAt: { lt: now } } }),
    prisma.libLoan.aggregate({ _sum: { fine: true } }),
    prisma.assetLoan.count({ where: { returnedAt: null } }),
    prisma.invoice.count({ where: { status: { in: ["OPEN", "PARTIAL"] } } }),
    prisma.invoice.count({
      where: { status: { in: ["OPEN", "PARTIAL"] }, dueDate: { not: null, lt: now } },
    }),
    prisma.invoice.aggregate({ where: { status: { in: ["OPEN", "PARTIAL"] } }, _sum: { total: true } }),
    prisma.operationalTxn.groupBy({
      by: ["kind"],
      where: { approvalStatus: "APPROVED", txnDate: { gte: mtdStart, lt: nextMonthStart } },
      _sum: { amount: true },
    }),
    prisma.waOutbox.count({ where: { status: "PENDING" } }),
    prisma.emailOutbox.count({ where: { status: "PENDING" } }),
    prisma.auditEvent.count({ where: { occurredAt: { gte: last24h } } }),
    prisma.dapodikSyncBatch.count({ where: { status: "PENDING" } }),
  ]);

  const financeOperationalMtd = financeOperationalMtdAgg.reduce(
    (acc, row) => {
      const amount = row._sum.amount ?? 0;
      if (row.kind === "INCOME") acc.income += amount;
      else if (row.kind === "EXPENSE") acc.expense += amount;
      else if (row.kind === "TRANSFER_IN") acc.transferIn += amount;
      else if (row.kind === "TRANSFER_OUT") acc.transferOut += amount;
      return acc;
    },
    { income: 0, expense: 0, transferIn: 0, transferOut: 0 },
  );
  const financeOperationalMtdWithNet = {
    ...financeOperationalMtd,
    net: financeOperationalMtd.income - financeOperationalMtd.expense,
  };

  return {
    ts: now.toISOString(),
    users: { total: usersTotal },
    academics: { students: studentsTotal, teachers: teachersTotal, employees: employeesTotal },
    attendance: {
      staffToday: { total: staffTodayTotal, checkedIn: staffTodayCheckedIn },
      studentsToday: { total: studentsTodayTotal },
    },
    ppdb: { total: ppdbTotal, byStatus: toStatusMap(ppdbByStatus) },
    library: {
      activeLoans: libraryActiveLoans,
      overdueLoans: libraryOverdueLoans,
      fineTotal: libraryFineTotalAgg._sum.fine ?? 0,
    },
    assets: { activeLoans: assetActiveLoans },
    finance: {
      openOrPartialInvoices: financeOpenOrPartial,
      overdueInvoices: financeOverdue,
      outstandingAmount: financeOutstandingAgg._sum.total ?? 0,
    },
    financeOperationalMtd: financeOperationalMtdWithNet,
    notifications: { waPending, emailPending },
    system: { auditEventsLast24h, dapodikQueuePending },
  };
}
