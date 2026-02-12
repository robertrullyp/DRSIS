"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type AnalyticsSummary = {
  ts: string;
  users: { total: number };
  academics: { students: number; teachers: number; employees: number };
  attendance: { staffToday: { total: number; checkedIn: number }; studentsToday: { total: number } };
  ppdb: { total: number; byStatus: Record<string, number> };
  library: { activeLoans: number; overdueLoans: number; fineTotal: number };
  assets: { activeLoans: number };
  finance: { openOrPartialInvoices: number; overdueInvoices: number; outstandingAmount: number };
  financeOperationalMtd: { income: number; expense: number; transferIn: number; transferOut: number; net: number };
  notifications: { waPending: number; emailPending: number };
  system: { auditEventsLast24h: number; dapodikQueuePending: number };
};

type AnalyticsSummaryResponse = { ok: boolean; summary: AnalyticsSummary };

type AnalyticsTimeseries = {
  ts: string;
  days: string[];
  attendance: {
    staff: { total: number[]; byStatus: Record<string, number[]> };
    students: { total: number[]; byStatus: Record<string, number[]> };
  };
  ppdb: { created: number[] };
  financeOperational: {
    income: number[];
    expense: number[];
    transferIn: number[];
    transferOut: number[];
    net: number[];
  };
};

type AnalyticsTimeseriesResponse = { ok: boolean; series: AnalyticsTimeseries };

type FinanceOutstandingItem = {
  academicYearId: string;
  academicYearName: string;
  isActive: boolean;
  count: number;
  amount: number;
};

type FinanceOutstandingResponse = { ok: boolean; items: FinanceOutstandingItem[] };

function formatTs(value: string) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return value;
  return d.toLocaleString("id-ID");
}

function formatIdr(value: number) {
  try {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `Rp ${value}`;
  }
}

function Card(props: { title: string; value: string | number; hint?: string }) {
  return (
    <section className="neo-card interactive-lift p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{props.title}</p>
      <p className="mt-2 text-2xl font-semibold">{props.value}</p>
      {props.hint ? <p className="mt-1 text-sm text-muted-foreground">{props.hint}</p> : null}
    </section>
  );
}

function pct(n: number, d: number) {
  if (!d) return "0%";
  return `${Math.round((n / d) * 100)}%`;
}

function LegendDot(props: { className: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${props.className}`} />;
}

function StackedDailyBars(props: {
  title: string;
  hint?: string;
  days: string[];
  byStatus: Record<string, number[]>;
  order: string[];
  labels: Record<string, string>;
  colors: Record<string, string>;
}) {
  const { title, hint, days, byStatus, order, labels, colors } = props;

  return (
    <section className="neo-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {order.map((k) => (
            <span key={k} className="inline-flex items-center gap-2">
              <LegendDot className={colors[k] || "bg-muted"} />
              <span>{labels[k] || k}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-max items-end gap-1">
          {days.map((day, idx) => {
            const total = order.reduce((sum, k) => sum + (byStatus[k]?.[idx] ?? 0), 0);
            const titleText = [day, ...order.map((k) => `${labels[k] || k}: ${byStatus[k]?.[idx] ?? 0}`), `Total: ${total}`].join("\n");
            return (
              <div
                key={day}
                title={titleText}
                className="flex h-24 w-3 flex-col-reverse overflow-hidden rounded-md border border-border bg-muted/15"
              >
                {order.map((k) => {
                  const value = byStatus[k]?.[idx] ?? 0;
                  if (!value || total <= 0) return null;
                  const heightPct = Math.max(0, Math.min(100, (value / total) * 100));
                  return <div key={k} className={colors[k] || "bg-muted"} style={{ height: `${heightPct}%` }} />;
                })}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex min-w-max gap-1 text-[10px] text-muted-foreground">
          {days.map((day) => (
            <div key={day} className="w-3 text-center">
              {day.slice(8, 10)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniBars(props: { title: string; hint?: string; days: string[]; values: number[]; barClassName: string }) {
  const max = Math.max(1, ...props.values);
  return (
    <section className="neo-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{props.title}</p>
          {props.hint ? <p className="text-xs text-muted-foreground">{props.hint}</p> : null}
        </div>
        <div className="text-xs text-muted-foreground">max: {max}</div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <div className="flex h-16 min-w-max items-end gap-1">
          {props.days.map((day, idx) => {
            const value = props.values[idx] ?? 0;
            const heightPct = Math.max(3, Math.round((value / max) * 100));
            return (
              <div
                key={day}
                title={`${day}: ${value}`}
                className="h-full w-3 rounded-md border border-border bg-muted/15 p-[1px]"
              >
                <div className={`w-full rounded-sm ${props.barClassName}`} style={{ height: `${heightPct}%` }} />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex min-w-max gap-1 text-[10px] text-muted-foreground">
          {props.days.map((day) => (
            <div key={day} className="w-3 text-center">
              {day.slice(8, 10)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AdminAnalyticsPage() {
  const [daysWindow, setDaysWindow] = useState<14 | 30>(14);

  const summaryQuery = useQuery<AnalyticsSummary>({
    queryKey: ["admin-analytics-summary"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/summary");
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(typeof payload?.error === "string" ? payload.error : "Failed to fetch analytics summary");
      }
      const payload = (await res.json()) as AnalyticsSummaryResponse;
      return payload.summary;
    },
    refetchInterval: 30_000,
  });

  const timeseriesQuery = useQuery<AnalyticsTimeseries>({
    queryKey: ["admin-analytics-timeseries", daysWindow],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/timeseries?days=${daysWindow}`);
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(typeof payload?.error === "string" ? payload.error : "Failed to fetch analytics timeseries");
      }
      const payload = (await res.json()) as AnalyticsTimeseriesResponse;
      return payload.series;
    },
    refetchInterval: 60_000,
  });

  const financeOutstandingQuery = useQuery<FinanceOutstandingItem[]>({
    queryKey: ["admin-analytics-finance-outstanding"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/finance/outstanding");
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(typeof payload?.error === "string" ? payload.error : "Failed to fetch finance outstanding breakdown");
      }
      const payload = (await res.json()) as FinanceOutstandingResponse;
      return payload.items;
    },
    refetchInterval: 60_000,
  });

  const s = summaryQuery.data;
  const series = timeseriesQuery.data;

  const ppdbFunnel = useMemo(() => {
    if (!s) return null;
    const total = s.ppdb.total || 0;
    const pending = s.ppdb.byStatus.PENDING ?? 0;
    const verified = s.ppdb.byStatus.VERIFIED ?? 0;
    const accepted = s.ppdb.byStatus.ACCEPTED ?? 0;
    const rejected = s.ppdb.byStatus.REJECTED ?? 0;
    const enrolled = s.ppdb.byStatus.ENROLLED ?? 0;
    const progressed = Math.max(0, total - pending);
    return {
      total,
      pending,
      verified,
      accepted,
      rejected,
      enrolled,
      progressed,
      rates: {
        progressed: pct(progressed, total),
        enrolled: pct(enrolled, total),
        accepted: pct(accepted + enrolled, total),
      },
    };
  }, [s]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Admin: Analitik</h1>
          <p className="text-sm text-muted-foreground">Ringkasan KPI lintas modul (auto refresh 30s).</p>
        </div>
        {s ? <div className="text-xs text-muted-foreground">Updated: {formatTs(s.ts)}</div> : null}
      </div>

      {summaryQuery.isLoading ? <div>Memuat…</div> : null}
      {summaryQuery.error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {(summaryQuery.error as Error).message}
        </div>
      ) : null}

      {s ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Window: <span className="font-semibold text-foreground">{daysWindow} hari</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDaysWindow(14)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  daysWindow === 14 ? "border-accent/40 bg-[color-mix(in_oklab,var(--accent)_12%,var(--card))]" : "border-border hover:bg-muted/60"
                }`}
              >
                14H
              </button>
              <button
                type="button"
                onClick={() => setDaysWindow(30)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  daysWindow === 30 ? "border-accent/40 bg-[color-mix(in_oklab,var(--accent)_12%,var(--card))]" : "border-border hover:bg-muted/60"
                }`}
              >
                30H
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Users" value={s.users.total} />
            <Card title="Siswa" value={s.academics.students} />
            <Card title="Guru" value={s.academics.teachers} />
            <Card title="Pegawai" value={s.academics.employees} />

            <Card
              title="Absensi Pegawai (Hari Ini)"
              value={`${s.attendance.staffToday.checkedIn}/${s.attendance.staffToday.total}`}
              hint="checked-in / total records"
            />
            <Card title="Absensi Siswa (Hari Ini)" value={s.attendance.studentsToday.total} />

            <Card title="PPDB Total" value={s.ppdb.total} />
            <Card
              title="PPDB Pending"
              value={s.ppdb.byStatus.PENDING ?? 0}
              hint="status menunggu verifikasi"
            />
            <Card title="Perpustakaan Aktif" value={s.library.activeLoans} hint="pinjaman belum kembali" />
            <Card title="Perpustakaan Overdue" value={s.library.overdueLoans} />
            <Card title="Perpustakaan Overdue Rate" value={pct(s.library.overdueLoans, s.library.activeLoans)} />
            <Card title="Denda Perpus (Total)" value={formatIdr(s.library.fineTotal)} />
            <Card title="Aset Dipinjam" value={s.assets.activeLoans} />
            <Card title="Tagihan Open/Partial" value={s.finance.openOrPartialInvoices} />
            <Card title="Tagihan Overdue" value={s.finance.overdueInvoices} />
            <Card title="Tagihan Outstanding" value={formatIdr(s.finance.outstandingAmount)} hint="total OPEN+PARTIAL" />
            <Card title="Cashflow MTD (Net)" value={formatIdr(s.financeOperationalMtd.net)} hint="income - expense (APPROVED)" />
            <Card title="WA Pending" value={s.notifications.waPending} />
            <Card title="Email Pending" value={s.notifications.emailPending} />
            <Card title="Audit Events (24h)" value={s.system.auditEventsLast24h} />
            <Card title="Dapodik Queue Pending" value={s.system.dapodikQueuePending} />
          </div>

          {ppdbFunnel ? (
            <section className="neo-card p-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">PPDB Funnel (Snapshot)</p>
                  <p className="text-xs text-muted-foreground">
                    Progress: {ppdbFunnel.rates.progressed} | Accepted: {ppdbFunnel.rates.accepted} | Enrolled: {ppdbFunnel.rates.enrolled}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">Total: {ppdbFunnel.total}</div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Card title="Pending" value={ppdbFunnel.pending} />
                <Card title="Verified" value={ppdbFunnel.verified} />
                <Card title="Accepted" value={ppdbFunnel.accepted} />
                <Card title="Enrolled" value={ppdbFunnel.enrolled} />
                <Card title="Rejected" value={ppdbFunnel.rejected} />
              </div>
            </section>
          ) : null}

          {timeseriesQuery.isLoading ? <div>Memuat tren…</div> : null}
          {timeseriesQuery.error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {(timeseriesQuery.error as Error).message}
            </div>
          ) : null}

          {series ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <StackedDailyBars
                title="Tren Absensi Pegawai"
                hint="Komposisi status per hari"
                days={series.days}
                byStatus={series.attendance.staff.byStatus}
                order={["PRESENT", "LATE", "LEAVE", "SICK", "ABSENT"]}
                labels={{
                  PRESENT: "Hadir",
                  LATE: "Terlambat",
                  LEAVE: "Izin",
                  SICK: "Sakit",
                  ABSENT: "Alfa",
                }}
                colors={{
                  PRESENT: "bg-[color-mix(in_oklab,var(--accent)_62%,transparent)]",
                  LATE: "bg-[color-mix(in_oklab,var(--accent-2)_62%,transparent)]",
                  LEAVE: "bg-muted/70",
                  SICK: "bg-muted-foreground/40",
                  ABSENT: "bg-[color-mix(in_oklab,var(--destructive)_50%,transparent)]",
                }}
              />

              <StackedDailyBars
                title="Tren Absensi Siswa"
                hint="Komposisi status per hari"
                days={series.days}
                byStatus={series.attendance.students.byStatus}
                order={["PRESENT", "LATE", "EXCUSED", "SICK", "ABSENT"]}
                labels={{
                  PRESENT: "Hadir",
                  LATE: "Terlambat",
                  EXCUSED: "Izin",
                  SICK: "Sakit",
                  ABSENT: "Alfa",
                }}
                colors={{
                  PRESENT: "bg-[color-mix(in_oklab,var(--accent)_62%,transparent)]",
                  LATE: "bg-[color-mix(in_oklab,var(--accent-2)_62%,transparent)]",
                  EXCUSED: "bg-muted/70",
                  SICK: "bg-muted-foreground/40",
                  ABSENT: "bg-[color-mix(in_oklab,var(--destructive)_50%,transparent)]",
                }}
              />

              <MiniBars
                title="PPDB: Pendaftaran Baru"
                hint="Jumlah aplikasi dibuat per hari"
                days={series.days}
                values={series.ppdb.created}
                barClassName="bg-[color-mix(in_oklab,var(--accent-2)_58%,transparent)]"
              />

              <MiniBars
                title="Keuangan Operasional: Income"
                hint="Total INCOME per hari (APPROVED)"
                days={series.days}
                values={series.financeOperational.income}
                barClassName="bg-[color-mix(in_oklab,var(--accent)_58%,transparent)]"
              />

              <MiniBars
                title="Keuangan Operasional: Expense"
                hint="Total EXPENSE per hari (APPROVED)"
                days={series.days}
                values={series.financeOperational.expense}
                barClassName="bg-[color-mix(in_oklab,var(--destructive)_42%,transparent)]"
              />
            </div>
          ) : null}

          <section className="neo-card p-5">
            <p className="text-sm font-semibold">PPDB by Status</p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-[420px] text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="border-b p-2 text-left">Status</th>
                    <th className="border-b p-2 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(s.ppdb.byStatus)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([status, count]) => (
                      <tr key={status}>
                        <td className="border-b p-2">{status}</td>
                        <td className="border-b p-2 text-right tabular-nums">{count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          {financeOutstandingQuery.error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {(financeOutstandingQuery.error as Error).message}
            </div>
          ) : null}

          {financeOutstandingQuery.data ? (
            <section className="neo-card p-5">
              <p className="text-sm font-semibold">Tagihan Outstanding per Tahun Ajaran</p>
              <p className="mt-1 text-xs text-muted-foreground">Status OPEN+PARTIAL, di-group per `AcademicYear`.</p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-[520px] text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="border-b p-2 text-left">Tahun Ajaran</th>
                      <th className="border-b p-2 text-right">Jumlah Tagihan</th>
                      <th className="border-b p-2 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeOutstandingQuery.data.map((row) => (
                      <tr key={row.academicYearId}>
                        <td className="border-b p-2">
                          <span className="font-medium">{row.academicYearName}</span>{" "}
                          {row.isActive ? <span className="text-xs text-muted-foreground">(aktif)</span> : null}
                        </td>
                        <td className="border-b p-2 text-right tabular-nums">{row.count}</td>
                        <td className="border-b p-2 text-right tabular-nums">{formatIdr(row.amount)}</td>
                      </tr>
                    ))}
                    {financeOutstandingQuery.data.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-3 text-muted-foreground">
                          Tidak ada tagihan outstanding.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
