"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FinanceAccount = {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
  category?: string | null;
  isActive: boolean;
  parent?: { id: string; code: string; name: string } | null;
};

const ACCOUNT_TYPES = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "INCOME",
  "EXPENSE",
] as const;

export default function FinanceOperationalAccountsPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof ACCOUNT_TYPES)[number]>("ASSET");
  const [category, setCategory] = useState("");
  const [parentId, setParentId] = useState("");

  const { data, isLoading } = useQuery<{ items: FinanceAccount[] }>({
    queryKey: ["finance-operational-accounts"],
    queryFn: async () =>
      (await (await fetch("/api/finance/operational/accounts?pageSize=500")).json()) as {
        items: FinanceAccount[];
      },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/finance/operational/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          type,
          category: category || undefined,
          parentId: parentId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? "Failed to create account");
      }
    },
    onSuccess: () => {
      setCode("");
      setName("");
      setCategory("");
      setParentId("");
      qc.invalidateQueries({ queryKey: ["finance-operational-accounts"] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (row: FinanceAccount) => {
      const res = await fetch(`/api/finance/operational/accounts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update account");
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["finance-operational-accounts"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan Operasional: COA</h1>

      <form
        className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 md:grid-cols-6 md:items-end"
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
          <label className="mb-1 block text-xs text-muted-foreground">Nama Akun</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tipe</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={type}
            onChange={(event) => setType(event.target.value as (typeof ACCOUNT_TYPES)[number])}
          >
            {ACCOUNT_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Kategori</label>
          <Input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Opsional"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Parent</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
          >
            <option value="">(Tidak ada)</option>
            {(data?.items ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} - {row.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={create.isPending}>
          Tambah Akun
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
                <th className="border-b p-2 text-left">Kategori</th>
                <th className="border-b p-2 text-left">Parent</th>
                <th className="border-b p-2 text-left">Status</th>
                <th className="border-b p-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="border-b p-2">{row.code}</td>
                  <td className="border-b p-2">{row.name}</td>
                  <td className="border-b p-2">{row.type}</td>
                  <td className="border-b p-2">{row.category ?? "-"}</td>
                  <td className="border-b p-2">
                    {row.parent ? `${row.parent.code} - ${row.parent.name}` : "-"}
                  </td>
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
              {(data?.items?.length ?? 0) === 0 && (
                <tr>
                  <td className="p-2 text-muted-foreground" colSpan={7}>
                    Belum ada akun COA.
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
