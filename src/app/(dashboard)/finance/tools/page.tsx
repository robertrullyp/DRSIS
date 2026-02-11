"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AY = { id: string; name: string };
type Grade = { id: string; name: string };

export default function FinanceToolsPage() {
  const { data: years } = useQuery<{ items: AY[] }>({ queryKey: ["ays"], queryFn: async () => (await (await fetch("/api/master/academic-years")).json()) as { items: AY[] } });
  const { data: grades } = useQuery<{ items: Grade[] }>({ queryKey: ["grades"], queryFn: async () => (await (await fetch("/api/master/grades")).json()) as { items: Grade[] } });
  const [ayId, setAyId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  useEffect(() => { if (!ayId && years?.items?.length) setAyId(years.items[0].id); }, [years, ayId]);

  const bulk = useMutation({
    mutationFn: async () => { const body: any = { academicYearId: ayId, gradeId: gradeId || undefined, dueDate: dueDate || undefined }; const r = await fetch('/api/finance/invoices/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!r.ok) throw new Error('Bulk failed'); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan: Tools</h1>
      <div className="grid grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Tahun Ajaran</label>
          <select className="border rounded px-3 py-2 w-full" value={ayId} onChange={(e) => setAyId(e.target.value)}>
            {years?.items?.map((y) => (<option key={y.id} value={y.id}>{y.name}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Tingkat (opsional)</label>
          <select className="border rounded px-3 py-2 w-full" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
            <option value="">(Semua)</option>
            {grades?.items?.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Jatuh Tempo</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <Button onClick={() => bulk.mutate()} disabled={bulk.isPending || !ayId}>Generate Invoice Massal</Button>
      </div>
      <div className="text-sm text-muted-foreground">Gunakan filter tingkat untuk generate fee rule grade-specific otomatis.</div>
    </div>
  );
}

