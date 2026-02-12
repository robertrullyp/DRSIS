"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PeriodLockItem = {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  lockedBy?: string | null;
  createdAt: string;
};

type PeriodLocksResponse = {
  items: PeriodLockItem[];
  total: number;
  page: number;
  pageSize: number;
};

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function FinanceOperationalPeriodLocksPage() {
  const qc = useQueryClient();
  const now = new Date();
  const [startDate, setStartDate] = useState(toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(toDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery<PeriodLocksResponse>({
    queryKey: ["finance-operational-period-locks"],
    queryFn: async () =>
      (await (await fetch("/api/finance/operational/period-locks?pageSize=200")).json()) as PeriodLocksResponse,
  });

  const createLock = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/finance/operational/period-locks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          reason: reason || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? "Failed to create period lock");
      }
    },
    onSuccess: () => {
      setReason("");
      qc.invalidateQueries({ queryKey: ["finance-operational-period-locks"] });
    },
  });

  const deleteLock = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/operational/period-locks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to delete period lock");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-operational-period-locks"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan Operasional: Lock Periode</h1>

      <form
        className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 md:grid-cols-5 md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (!startDate || !endDate) return;
          createLock.mutate();
        }}
      >
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Mulai</label>
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Selesai</label>
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-muted-foreground">Alasan</label>
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Contoh: Tutup buku bulanan"
          />
        </div>
        <Button type="submit" disabled={createLock.isPending}>
          Tambah Lock
        </Button>
      </form>

      {isLoading ? (
        <div>Memuat...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b p-2 text-left">Periode</th>
                <th className="border-b p-2 text-left">Alasan</th>
                <th className="border-b p-2 text-left">Dibuat</th>
                <th className="border-b p-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="border-b p-2">
                    {new Date(row.startDate).toLocaleDateString("id-ID")} -{" "}
                    {new Date(row.endDate).toLocaleDateString("id-ID")}
                  </td>
                  <td className="border-b p-2">{row.reason || "-"}</td>
                  <td className="border-b p-2">
                    <div>{new Date(row.createdAt).toLocaleString("id-ID")}</div>
                    <div className="text-xs text-muted-foreground">{row.lockedBy || "-"}</div>
                  </td>
                  <td className="border-b p-2">
                    <Button
                      variant="outline"
                      onClick={() => deleteLock.mutate(row.id)}
                      disabled={deleteLock.isPending}
                    >
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))}
              {(data?.items?.length ?? 0) === 0 ? (
                <tr>
                  <td className="p-2 text-muted-foreground" colSpan={4}>
                    Belum ada periode lock.
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

