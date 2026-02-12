"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Refund = { id: string; amount: number; reason?: string | null; processedBy?: string | null };
type Payment = {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  reference?: string | null;
  refunds: Refund[];
};
type Discount = { id: string; name: string; amount: number; reason?: string | null };
type InvoiceDetail = {
  id: string;
  code: string;
  status: string;
  total: number;
  dueDate?: string | null;
  student: { user?: { name?: string | null } | null };
  academicYear: { name: string };
  items: { id: string; name: string; amount: number }[];
  discounts: Discount[];
  payments: Payment[];
  balance: {
    grossTotal: number;
    discountTotal: number;
    netTotal: number;
    paymentTotal: number;
    refundTotal: number;
    paidNet: number;
    due: number;
    overpaid: number;
  };
};

function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FinanceInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [discountName, setDiscountName] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  const { data, isLoading } = useQuery<InvoiceDetail>({
    queryKey: ["invoice-detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/finance/invoices/${id}`);
      if (!res.ok) throw new Error("Failed to load invoice");
      return (await res.json()) as InvoiceDetail;
    },
    enabled: Boolean(id),
  });

  const paymentMethods = useMemo(
    () => ["CASH", "TRANSFER", "GATEWAY", "SCHOLARSHIP", "ADJUSTMENT"],
    []
  );

  const addPayment = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/finance/invoices/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          method: paymentMethod,
          reference: paymentReference || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Add payment failed");
    },
    onSuccess: () => {
      setPaymentAmount("");
      setPaymentReference("");
      qc.invalidateQueries({ queryKey: ["invoice-detail", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const addDiscount = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/finance/invoices/${id}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: discountName,
          amount: Number(discountAmount),
          reason: discountReason || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Add discount failed");
    },
    onSuccess: () => {
      setDiscountName("");
      setDiscountAmount("");
      setDiscountReason("");
      qc.invalidateQueries({ queryKey: ["invoice-detail", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const removeDiscount = useMutation({
    mutationFn: async (discountId: string) => {
      const res = await fetch(
        `/api/finance/invoices/${id}/discounts/${discountId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error((await res.json()).error || "Delete discount failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-detail", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const addRefund = useMutation({
    mutationFn: async ({ paymentId, amount }: { paymentId: string; amount: number }) => {
      const res = await fetch(`/api/finance/payments/${paymentId}/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Refund failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-detail", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  if (isLoading || !data) return <div>Memuat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/finance/invoices" className="text-sm text-accent underline">
          Kembali ke daftar
        </Link>
        <h1 className="text-lg font-semibold">Invoice {data.code}</h1>
        <span className="rounded bg-muted px-2 py-1 text-xs">{data.status}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">Siswa</p>
          <p className="font-medium">{data.student.user?.name ?? "-"}</p>
          <p className="text-xs text-muted-foreground">{data.academicYear.name}</p>
        </article>
        <article className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">Total Tagihan Bersih</p>
          <p className="text-lg font-semibold">{money(data.balance.netTotal)}</p>
          <p className="text-xs text-muted-foreground">
            kotor {money(data.balance.grossTotal)} - diskon {money(data.balance.discountTotal)}
          </p>
        </article>
        <article className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">Sisa Piutang</p>
          <p className="text-lg font-semibold">{money(data.balance.due)}</p>
          <p className="text-xs text-muted-foreground">
            terbayar bersih {money(data.balance.paidNet)}
          </p>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="space-y-2 rounded-xl border border-border p-3">
          <h2 className="font-medium">Tambah Pembayaran</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <Input
              type="number"
              min={1}
              placeholder="Nominal"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
            />
            <select
              className="rounded border px-3 py-2"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <Input
              placeholder="Referensi (opsional)"
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
            />
            <Button
              onClick={() => addPayment.mutate()}
              disabled={addPayment.isPending || !paymentAmount}
            >
              Simpan Pembayaran
            </Button>
          </div>
        </section>

        <section className="space-y-2 rounded-xl border border-border p-3">
          <h2 className="font-medium">Tambah Diskon</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <Input
              placeholder="Nama diskon"
              value={discountName}
              onChange={(event) => setDiscountName(event.target.value)}
            />
            <Input
              type="number"
              min={1}
              placeholder="Nominal"
              value={discountAmount}
              onChange={(event) => setDiscountAmount(event.target.value)}
            />
            <Input
              placeholder="Alasan (opsional)"
              value={discountReason}
              onChange={(event) => setDiscountReason(event.target.value)}
            />
            <Button
              onClick={() => addDiscount.mutate()}
              disabled={addDiscount.isPending || !discountName || !discountAmount}
            >
              Simpan Diskon
            </Button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b p-2 text-left">Item</th>
                <th className="border-b p-2 text-left">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td className="border-b p-2">{item.name}</td>
                  <td className="border-b p-2">{money(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b p-2 text-left">Diskon</th>
                <th className="border-b p-2 text-left">Nominal</th>
                <th className="border-b p-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.discounts.map((discount) => (
                <tr key={discount.id}>
                  <td className="border-b p-2">
                    <div>{discount.name}</div>
                    <div className="text-xs text-muted-foreground">{discount.reason || "-"}</div>
                  </td>
                  <td className="border-b p-2">{money(discount.amount)}</td>
                  <td className="border-b p-2">
                    <Button
                      variant="outline"
                      onClick={() => removeDiscount.mutate(discount.id)}
                      disabled={removeDiscount.isPending}
                    >
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))}
              {data.discounts.length === 0 ? (
                <tr>
                  <td className="p-2 text-muted-foreground" colSpan={3}>
                    Belum ada diskon.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>

      <section className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="border-b p-2 text-left">Waktu</th>
              <th className="border-b p-2 text-left">Metode</th>
              <th className="border-b p-2 text-left">Nominal</th>
              <th className="border-b p-2 text-left">Refund</th>
              <th className="border-b p-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.map((payment) => (
              <tr key={payment.id}>
                <td className="border-b p-2">{new Date(payment.paidAt).toLocaleString()}</td>
                <td className="border-b p-2">{payment.method}</td>
                <td className="border-b p-2">{money(payment.amount)}</td>
                <td className="border-b p-2">
                  {payment.refunds.length > 0
                    ? money(payment.refunds.reduce((acc, row) => acc + row.amount, 0))
                    : "-"}
                </td>
                <td className="border-b p-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const value = prompt("Nominal refund");
                      if (!value) return;
                      const amount = Number(value);
                      if (!Number.isFinite(amount) || amount <= 0) return;
                      addRefund.mutate({ paymentId: payment.id, amount });
                    }}
                    disabled={addRefund.isPending}
                  >
                    Refund
                  </Button>
                </td>
              </tr>
            ))}
            {data.payments.length === 0 ? (
              <tr>
                <td className="p-2 text-muted-foreground" colSpan={5}>
                  Belum ada pembayaran.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
