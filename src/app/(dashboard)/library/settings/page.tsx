"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Setting = { id: string; maxLoans: number; loanDays: number; finePerDay: number };

export default function LibrarySettingsPage() {
  const { data, isFetching, refetch } = useQuery<Setting>({
    queryKey: ["lib-setting"],
    queryFn: async () => {
      const res = await fetch("/api/library/settings");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as Setting;
    },
  });

  const [maxLoans, setMaxLoans] = useState<string>("");
  const [loanDays, setLoanDays] = useState<string>("");
  const [finePerDay, setFinePerDay] = useState<string>("");

  const save = useMutation({
    mutationFn: async () => {
      const body: any = {};
      if (maxLoans !== "") body.maxLoans = Number(maxLoans);
      if (loanDays !== "") body.loanDays = Number(loanDays);
      if (finePerDay !== "") body.finePerDay = Number(finePerDay);
      const res = await fetch("/api/library/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => { refetch(); setMaxLoans(""); setLoanDays(""); setFinePerDay(""); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Perpustakaan: Pengaturan</h1>
      {isFetching ? (
        <div>Memuat…</div>
      ) : data ? (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Saat ini: maxLoans {data.maxLoans}, loanDays {data.loanDays}, finePerDay {data.finePerDay}</div>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Maks Pinjaman Aktif</label>
              <Input type="number" value={maxLoans} onChange={(e) => setMaxLoans(e.target.value)} placeholder={String(data.maxLoans)} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Hari Peminjaman</label>
              <Input type="number" value={loanDays} onChange={(e) => setLoanDays(e.target.value)} placeholder={String(data.loanDays)} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Denda / Hari</label>
              <Input type="number" value={finePerDay} onChange={(e) => setFinePerDay(e.target.value)} placeholder={String(data.finePerDay)} />
            </div>
            <div className="col-span-3">
              <Button disabled={save.isPending}>Simpan</Button>
            </div>
          </form>
        </div>
      ) : (
        <div>Pengaturan tidak ditemukan</div>
      )}
    </div>
  );
}
