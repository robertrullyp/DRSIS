"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Account = {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
  isActive: boolean;
};
type CashBank = {
  id: string;
  code: string;
  name: string;
  type: "CASH" | "BANK";
  balance: number;
  isActive: boolean;
};
type Txn = {
  id: string;
  txnDate: string;
  kind: "INCOME" | "EXPENSE" | "TRANSFER_IN" | "TRANSFER_OUT";
  amount: number;
  description?: string | null;
  referenceNo?: string | null;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  checkedBy?: string | null;
  approvedBy?: string | null;
  rejectedReason?: string | null;
  account: { code: string; name: string };
  cashBankAccount: { code: string; name: string; balance: number };
};
type Summary = {
  totals: {
    income: number;
    expense: number;
    transferIn: number;
    transferOut: number;
    netOperational: number;
    totalCashBankBalance: number;
  };
};

function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FinanceOperationalTransactionsPage() {
  const qc = useQueryClient();
  const [txnDate, setTxnDate] = useState(new Date().toISOString().slice(0, 10));
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [accountId, setAccountId] = useState("");
  const [cashBankAccountId, setCashBankAccountId] = useState("");

  const [transferAmount, setTransferAmount] = useState("");
  const [fromCashBankAccountId, setFromCashBankAccountId] = useState("");
  const [toCashBankAccountId, setToCashBankAccountId] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [transferDesc, setTransferDesc] = useState("");
  const [transferProofUrl, setTransferProofUrl] = useState("");

  const { data: accounts } = useQuery<{ items: Account[] }>({
    queryKey: ["finance-operational-accounts"],
    queryFn: async () =>
      (await (await fetch("/api/finance/operational/accounts?pageSize=500&isActive=true")).json()) as {
        items: Account[];
      },
  });
  const { data: cashBanks } = useQuery<{ items: CashBank[] }>({
    queryKey: ["finance-cash-bank"],
    queryFn: async () =>
      (await (await fetch("/api/finance/operational/cash-accounts?pageSize=500&isActive=true")).json()) as {
        items: CashBank[];
      },
  });
  const { data: txns, isLoading } = useQuery<{ items: Txn[] }>({
    queryKey: ["finance-operational-txns"],
    queryFn: async () =>
      (await (await fetch("/api/finance/operational/transactions?pageSize=200")).json()) as {
        items: Txn[];
      },
  });
  const { data: summary } = useQuery<Summary>({
    queryKey: ["finance-operational-summary"],
    queryFn: async () =>
      (await (await fetch("/api/finance/operational/summary")).json()) as Summary,
  });

  const incomeExpenseAccountOptions = useMemo(() => {
    return (accounts?.items ?? []).filter((row) =>
      kind === "INCOME" ? row.type === "INCOME" : row.type === "EXPENSE"
    );
  }, [accounts?.items, kind]);

  const postTxn = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/finance/operational/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txnDate,
          kind,
          amount: Number(amount),
          description: description || undefined,
          referenceNo: referenceNo || undefined,
          proofUrl: proofUrl || undefined,
          accountId,
          cashBankAccountId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? "Failed to create transaction");
      }
    },
    onSuccess: () => {
      setAmount("");
      setDescription("");
      setReferenceNo("");
      setProofUrl("");
      qc.invalidateQueries({ queryKey: ["finance-operational-txns"] });
      qc.invalidateQueries({ queryKey: ["finance-operational-summary"] });
      qc.invalidateQueries({ queryKey: ["finance-cash-bank"] });
    },
  });

  const postTransfer = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/finance/operational/transactions/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txnDate,
          amount: Number(transferAmount),
          description: transferDesc || undefined,
          referenceNo: transferRef || undefined,
          proofUrl: transferProofUrl || undefined,
          fromCashBankAccountId,
          toCashBankAccountId,
          fromAccountId,
          toAccountId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? "Failed to transfer");
      }
    },
    onSuccess: () => {
      setTransferAmount("");
      setTransferDesc("");
      setTransferRef("");
      setTransferProofUrl("");
      qc.invalidateQueries({ queryKey: ["finance-operational-txns"] });
      qc.invalidateQueries({ queryKey: ["finance-operational-summary"] });
      qc.invalidateQueries({ queryKey: ["finance-cash-bank"] });
    },
  });

  const checkTxn = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/finance/operational/transactions/${id}/check`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? "Check failed");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-operational-txns"] });
    },
  });

  const approveTxn = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/finance/operational/transactions/${id}/approve`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? "Approve failed");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-operational-txns"] });
      qc.invalidateQueries({ queryKey: ["finance-operational-summary"] });
      qc.invalidateQueries({ queryKey: ["finance-cash-bank"] });
    },
  });

  const rejectTxn = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(
        `/api/finance/operational/transactions/${id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? "Reject failed");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-operational-txns"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan Operasional: Transaksi</h1>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <article className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">Kas Masuk</p>
          <p className="text-lg font-semibold">{money(summary?.totals.income ?? 0)}</p>
        </article>
        <article className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">Kas Keluar</p>
          <p className="text-lg font-semibold">{money(summary?.totals.expense ?? 0)}</p>
        </article>
        <article className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">Neto Operasional</p>
          <p className="text-lg font-semibold">{money(summary?.totals.netOperational ?? 0)}</p>
        </article>
        <article className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">Saldo Kas/Bank</p>
          <p className="text-lg font-semibold">
            {money(summary?.totals.totalCashBankBalance ?? 0)}
          </p>
        </article>
      </div>

      <form
        className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 md:grid-cols-8 md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (!amount || !accountId || !cashBankAccountId) return;
          postTxn.mutate();
        }}
      >
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tanggal</label>
          <Input type="date" value={txnDate} onChange={(event) => setTxnDate(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Jenis</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={kind}
            onChange={(event) => {
              const next = event.target.value as "INCOME" | "EXPENSE";
              setKind(next);
              setAccountId("");
            }}
          >
            <option value="INCOME">INCOME</option>
            <option value="EXPENSE">EXPENSE</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Nominal</label>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Akun COA</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
          >
            <option value="">Pilih akun</option>
            {incomeExpenseAccountOptions.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} - {row.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Kas/Bank</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={cashBankAccountId}
            onChange={(event) => setCashBankAccountId(event.target.value)}
          >
            <option value="">Pilih rekening</option>
            {(cashBanks?.items ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} - {row.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Ref</label>
          <Input
            value={referenceNo}
            onChange={(event) => setReferenceNo(event.target.value)}
            placeholder="Opsional"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Proof URL</label>
          <Input
            value={proofUrl}
            onChange={(event) => setProofUrl(event.target.value)}
            placeholder="https://..."
          />
        </div>
        <Button type="submit" disabled={postTxn.isPending}>
          Simpan
        </Button>
        <div className="md:col-span-8">
          <label className="mb-1 block text-xs text-muted-foreground">Deskripsi</label>
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Keterangan transaksi"
          />
        </div>
      </form>

      <form
        className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 md:grid-cols-8 md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (!transferAmount || !fromCashBankAccountId || !toCashBankAccountId || !fromAccountId || !toAccountId) {
            return;
          }
          postTransfer.mutate();
        }}
      >
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Transfer Nominal</label>
          <Input
            type="number"
            min={1}
            value={transferAmount}
            onChange={(event) => setTransferAmount(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Dari Kas/Bank</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={fromCashBankAccountId}
            onChange={(event) => setFromCashBankAccountId(event.target.value)}
          >
            <option value="">Pilih</option>
            {(cashBanks?.items ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} - {row.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Ke Kas/Bank</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={toCashBankAccountId}
            onChange={(event) => setToCashBankAccountId(event.target.value)}
          >
            <option value="">Pilih</option>
            {(cashBanks?.items ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} - {row.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Akun OUT</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={fromAccountId}
            onChange={(event) => setFromAccountId(event.target.value)}
          >
            <option value="">Pilih</option>
            {(accounts?.items ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} - {row.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Akun IN</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={toAccountId}
            onChange={(event) => setToAccountId(event.target.value)}
          >
            <option value="">Pilih</option>
            {(accounts?.items ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} - {row.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Ref</label>
          <Input
            value={transferRef}
            onChange={(event) => setTransferRef(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Proof URL</label>
          <Input
            value={transferProofUrl}
            onChange={(event) => setTransferProofUrl(event.target.value)}
            placeholder="https://..."
          />
        </div>
        <Button type="submit" disabled={postTransfer.isPending}>
          Transfer
        </Button>
        <div className="md:col-span-8">
          <label className="mb-1 block text-xs text-muted-foreground">Deskripsi Transfer</label>
          <Input
            value={transferDesc}
            onChange={(event) => setTransferDesc(event.target.value)}
          />
        </div>
      </form>

      {isLoading ? (
        <div>Memuat...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b p-2 text-left">Tanggal</th>
                <th className="border-b p-2 text-left">Jenis</th>
                <th className="border-b p-2 text-left">Akun COA</th>
                <th className="border-b p-2 text-left">Kas/Bank</th>
                <th className="border-b p-2 text-left">Nominal</th>
                <th className="border-b p-2 text-left">Status</th>
                <th className="border-b p-2 text-left">Keterangan</th>
                <th className="border-b p-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(txns?.items ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="border-b p-2">{new Date(row.txnDate).toLocaleString()}</td>
                  <td className="border-b p-2">{row.kind}</td>
                  <td className="border-b p-2">
                    {row.account.code} - {row.account.name}
                  </td>
                  <td className="border-b p-2">
                    {row.cashBankAccount.code} - {row.cashBankAccount.name}
                  </td>
                  <td className="border-b p-2">{money(row.amount)}</td>
                  <td className="border-b p-2">
                    <div>{row.approvalStatus ?? "PENDING"}</div>
                    {row.approvalStatus === "REJECTED" && row.rejectedReason ? (
                      <div className="text-xs text-muted-foreground">{row.rejectedReason}</div>
                    ) : null}
                  </td>
                  <td className="border-b p-2">{row.description || row.referenceNo || "-"}</td>
                  <td className="border-b p-2 space-x-2 whitespace-nowrap">
                    <Button
                      variant="outline"
                      onClick={() => checkTxn.mutate(row.id)}
                      disabled={checkTxn.isPending || row.approvalStatus !== "PENDING" || Boolean(row.checkedBy)}
                    >
                      Check
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => approveTxn.mutate(row.id)}
                      disabled={approveTxn.isPending || row.approvalStatus !== "PENDING" || !row.checkedBy}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const reason = prompt("Alasan reject");
                        if (!reason) return;
                        rejectTxn.mutate({ id: row.id, reason });
                      }}
                      disabled={rejectTxn.isPending || row.approvalStatus !== "PENDING"}
                    >
                      Reject
                    </Button>
                  </td>
                </tr>
              ))}
              {(txns?.items?.length ?? 0) === 0 && (
                <tr>
                  <td className="p-2 text-muted-foreground" colSpan={9}>
                    Belum ada transaksi operasional.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
