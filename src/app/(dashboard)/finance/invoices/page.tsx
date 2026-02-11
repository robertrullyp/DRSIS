"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Student = { id: string; user: { name?: string | null } };
type AY = { id: string; name: string };
type Invoice = { id: string; code: string; total: number; status: string; student: { user: { name?: string | null } }; items: { id: string; name: string; amount: number }[] };

export default function InvoicesPage() {
  const qc = useQueryClient();
  const { data: students } = useQuery<{ items: Student[] }>({ queryKey: ["students"], queryFn: async () => (await (await fetch("/api/master/students")).json()) as { items: Student[] } });
  const { data: years } = useQuery<{ items: AY[] }>({ queryKey: ["ays"], queryFn: async () => (await (await fetch("/api/master/academic-years")).json()) as { items: AY[] } });
  const { data, isLoading } = useQuery<{ items: Invoice[] }>({ queryKey: ["invoices"], queryFn: async () => (await (await fetch("/api/finance/invoices")).json()) as { items: Invoice[] } });

  const [studentId, setStudentId] = useState("");
  const [ayId, setAyId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lines, setLines] = useState<{ name: string; amount: string }[]>([{ name: "", amount: "" }]);
  useEffect(() => { if (!studentId && students?.items?.length) setStudentId(students.items[0].id); if (!ayId && years?.items?.length) setAyId(years.items[0].id); }, [students, years, studentId, ayId]);

  const create = useMutation({
    mutationFn: async () => {
      const items = lines.filter((l) => l.name && l.amount).map((l) => ({ name: l.name, amount: Number(l.amount) }));
      const body: any = { studentId, academicYearId: ayId, dueDate: dueDate || undefined, items };
      const res = await fetch("/api/finance/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => { setLines([{ name: "", amount: "" }]); setDueDate(""); qc.invalidateQueries({ queryKey: ["invoices"] }); },
  });

  const pay = useMutation({
    mutationFn: async ({ id, amount, method }: { id: string; amount: number; method: string }) => {
      const res = await fetch(`/api/finance/invoices/${id}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, method }) });
      if (!res.ok) throw new Error("Payment failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan: Tagihan</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (!studentId || !ayId) return; create.mutate(); }} className="space-y-3">
        <div className="grid grid-cols-4 gap-2 items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Siswa</label>
            <select className="border rounded px-3 py-2 w-full" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {students?.items?.map((s) => (<option key={s.id} value={s.id}>{s.user?.name ?? s.id}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Tahun Ajaran</label>
            <select className="border rounded px-3 py-2 w-full" value={ayId} onChange={(e) => setAyId(e.target.value)}>
              {years?.items?.map((y) => (<option key={y.id} value={y.id}>{y.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Jatuh Tempo</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <Button type="submit" disabled={create.isPending}>Buat Invoice</Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Item Invoice</div>
          {lines.map((l, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2">
              <Input placeholder="Nama item" value={l.name} onChange={(e) => setLines((arr) => arr.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
              <Input placeholder="Jumlah" type="number" value={l.amount} onChange={(e) => setLines((arr) => arr.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x))} />
              <Button type="button" variant="outline" onClick={() => setLines((arr) => arr.filter((_, i) => i !== idx))}>Hapus</Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setLines((arr) => [...arr, { name: "", amount: "" }])}>Tambah Baris</Button>
        </div>
      </form>

      {isLoading ? <div>Memuat…</div> : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50"><tr><th className="text-left p-2 border-b">Kode</th><th className="text-left p-2 border-b">Siswa</th><th className="text-left p-2 border-b">Total</th><th className="text-left p-2 border-b">Status</th><th className="text-left p-2 border-b">Aksi</th></tr></thead>
          <tbody>
            {(data?.items ?? []).map((inv) => (
              <tr key={inv.id}>
                <td className="p-2 border-b">{inv.code}</td>
                <td className="p-2 border-b">{inv.student.user?.name ?? '-'}</td>
                <td className="p-2 border-b">{inv.total}</td>
                <td className="p-2 border-b">{inv.status}</td>
                <td className="p-2 border-b space-x-2">
                  <Button variant="outline" onClick={() => window.open(`/api/finance/invoices/${inv.id}/receipt`, '_blank')}>Kuitansi</Button>
                  <Button variant="outline" onClick={() => {
                    const amt = prompt('Nominal pembayaran');
                    if (!amt) return;
                    pay.mutate({ id: inv.id, amount: Number(amt), method: 'CASH' });
                  }}>Bayar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

