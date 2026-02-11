"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Grade = { id: string; name: string };
type FeeRule = { id: string; name: string; amount: number; recurring: boolean; grade?: { name: string } | null };

export default function FeeRulesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ items: FeeRule[] }>({ queryKey: ["fee-rules"], queryFn: async () => (await (await fetch("/api/finance/fee-rules")).json()) as { items: FeeRule[] } });
  const { data: grades } = useQuery<{ items: Grade[] }>({ queryKey: ["grades"], queryFn: async () => (await (await fetch("/api/master/grades")).json()) as { items: Grade[] } });

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [gradeId, setGradeId] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const body: any = { name, amount: Number(amount), recurring };
      if (gradeId) body.gradeId = gradeId;
      const res = await fetch("/api/finance/fee-rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => { setName(""); setAmount(""); setRecurring(false); qc.invalidateQueries({ queryKey: ["fee-rules"] }); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan: Aturan Biaya</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (!name || !amount) return; create.mutate(); }} className="grid grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Nama</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Jumlah</label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tingkat (opsional)</label>
          <select className="border rounded px-3 py-2 w-full" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
            <option value="">(Tidak ditentukan)</option>
            {grades?.items?.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input id="rec" type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          <label htmlFor="rec" className="text-sm">Recurring</label>
        </div>
        <Button type="submit" disabled={create.isPending}>Tambah</Button>
      </form>

      {isLoading ? <div>Memuat…</div> : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-50"><tr><th className="text-left p-2 border-b">Nama</th><th className="text-left p-2 border-b">Jumlah</th><th className="text-left p-2 border-b">Tingkat</th><th className="text-left p-2 border-b">Recurring</th></tr></thead>
          <tbody>
            {(data?.items ?? []).map((f) => (
              <tr key={f.id}><td className="p-2 border-b">{f.name}</td><td className="p-2 border-b">{f.amount}</td><td className="p-2 border-b">{f.grade?.name ?? '-'}</td><td className="p-2 border-b">{f.recurring ? 'Ya' : '-'}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

