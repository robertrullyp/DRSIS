"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

type SummaryResponse = {
  totals: {
    grossTotal: number;
    discountTotal: number;
    netTotal: number;
    paymentTotal: number;
    refundTotal: number;
    paidNet: number;
    due: number;
    overpaid: number;
  };
  billed: { amount: number; count: number };
  discounts: { amount: number; count: number };
  payments: { amount: number; count: number };
  refunds: { amount: number; count: number };
  scholarships: { amount: number; count: number };
  open: { amount: number; count: number };
  partial: { amount: number; count: number };
  paid: { amount: number; count: number };
};

function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FinanceReportsPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const monthStart = useMemo(() => `${today.slice(0, 8)}01`, [today]);
  const [start, setStart] = useState(monthStart);
  const [end, setEnd] = useState(today);

  const { data, isLoading, refetch } = useQuery<SummaryResponse>({
    queryKey: ["finance-summary", start, end],
    queryFn: async () => {
      const params = new URLSearchParams({ start, end });
      const res = await fetch(`/api/finance/reports/summary?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load summary");
      return (await res.json()) as SummaryResponse;
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan: Laporan Ringkas</h1>

      <div className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Mulai</label>
          <Input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Sampai</label>
          <Input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/80"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div>Memuat...</div>
      ) : data ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Tagihan Kotor</p>
            <p className="text-lg font-semibold">{money(data.totals.grossTotal)}</p>
            <p className="text-xs text-muted-foreground">{data.billed.count} invoice</p>
          </article>
          <article className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Diskon</p>
            <p className="text-lg font-semibold">{money(data.totals.discountTotal)}</p>
            <p className="text-xs text-muted-foreground">{data.discounts.count} transaksi</p>
          </article>
          <article className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Pembayaran Bersih</p>
            <p className="text-lg font-semibold">{money(data.totals.paidNet)}</p>
            <p className="text-xs text-muted-foreground">
              bayar {money(data.totals.paymentTotal)} - refund {money(data.totals.refundTotal)}
            </p>
          </article>
          <article className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Piutang Tersisa</p>
            <p className="text-lg font-semibold">{money(data.totals.due)}</p>
            <p className="text-xs text-muted-foreground">tagihan bersih {money(data.totals.netTotal)}</p>
          </article>
          <article className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Invoice OPEN</p>
            <p className="text-lg font-semibold">{data.open.count}</p>
            <p className="text-xs text-muted-foreground">{money(data.open.amount)}</p>
          </article>
          <article className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Invoice PARTIAL</p>
            <p className="text-lg font-semibold">{data.partial.count}</p>
            <p className="text-xs text-muted-foreground">{money(data.partial.amount)}</p>
          </article>
          <article className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Invoice PAID</p>
            <p className="text-lg font-semibold">{data.paid.count}</p>
            <p className="text-xs text-muted-foreground">{money(data.paid.amount)}</p>
          </article>
          <article className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Beasiswa Aktif Periode</p>
            <p className="text-lg font-semibold">{money(data.scholarships.amount)}</p>
            <p className="text-xs text-muted-foreground">{data.scholarships.count} entri</p>
          </article>
        </div>
      ) : (
        <div>Data tidak tersedia.</div>
      )}
    </div>
  );
}
