"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CashBank = {
  id: string;
  code: string;
  name: string;
  type: "CASH" | "BANK";
  bankName?: string | null;
  accountNumber?: string | null;
  ownerName?: string | null;
  openingBalance: number;
  balance: number;
  isActive: boolean;
};

function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FinanceOperationalCashBankPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"CASH" | "BANK">("CASH");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");

  const { data, isLoading } = useQuery<{ items: CashBank[] }>({
    queryKey: ["finance-cash-bank"],
    queryFn: async () =>
      (await (await fetch("/api/finance/operational/cash-accounts?pageSize=500")).json()) as {
        items: CashBank[];
      },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/finance/operational/cash-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          type,
          bankName: bankName || undefined,
          accountNumber: accountNumber || undefined,
          ownerName: ownerName || undefined,
          openingBalance: Number(openingBalance || 0),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? "Failed to create cash/bank account");
      }
    },
    onSuccess: () => {
      setCode("");
      setName("");
      setBankName("");
      setAccountNumber("");
      setOwnerName("");
      setOpeningBalance("0");
      qc.invalidateQueries({ queryKey: ["finance-cash-bank"] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (row: CashBank) => {
      const res = await fetch(`/api/finance/operational/cash-accounts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update account");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance-cash-bank"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan Operasional: Kas &amp; Bank</h1>

      <form
        className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 md:grid-cols-8 md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (!code || !name) return;
          create.mutate();
        }}
      >
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Kode</label>
          <Input value={code} onChange={(event) => setCode(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Nama</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tipe</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={type}
            onChange={(event) => setType(event.target.value as "CASH" | "BANK")}
          >
            <option value="CASH">CASH</option>
            <option value="BANK">BANK</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Nama Bank</label>
          <Input value={bankName} onChange={(event) => setBankName(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">No Rekening</label>
          <Input
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Pemilik</label>
          <Input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Saldo Awal</label>
          <Input
            type="number"
            value={openingBalance}
            onChange={(event) => setOpeningBalance(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={create.isPending}>
          Tambah
        </Button>
      </form>

      {isLoading ? (
        <div>Memuat...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b p-2 text-left">Kode</th>
                <th className="border-b p-2 text-left">Nama</th>
                <th className="border-b p-2 text-left">Tipe</th>
                <th className="border-b p-2 text-left">Saldo Awal</th>
                <th className="border-b p-2 text-left">Saldo Saat Ini</th>
                <th className="border-b p-2 text-left">Status</th>
                <th className="border-b p-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="border-b p-2">{row.code}</td>
                  <td className="border-b p-2">
                    <div>{row.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.bankName || "-"} {row.accountNumber ? `• ${row.accountNumber}` : ""}
                    </div>
                  </td>
                  <td className="border-b p-2">{row.type}</td>
                  <td className="border-b p-2">{money(row.openingBalance)}</td>
                  <td className="border-b p-2">{money(row.balance)}</td>
                  <td className="border-b p-2">{row.isActive ? "Aktif" : "Nonaktif"}</td>
                  <td className="border-b p-2">
                    <Button
                      variant="outline"
                      onClick={() => toggleActive.mutate(row)}
                      disabled={toggleActive.isPending}
                    >
                      {row.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </td>
                </tr>
              ))}
              {(data?.items?.length ?? 0) === 0 ? (
                <tr>
                  <td className="p-2 text-muted-foreground" colSpan={7}>
                    Belum ada rekening kas/bank.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
