"use client";

import { useCallback, useEffect, useState } from "react";

type Grade = { id: string; name: string };
type Row = { id: string; fullName: string; status: string; gradeApplied?: { id: string; name: string } | null };

export default function PpdbAnnouncementPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeId, setGradeId] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (gradeId) params.set("gradeId", gradeId);
      const res = await fetch(`/api/public/ppdb/announcement?${params.toString()}`);
      if (res.ok) {
        const j = await res.json();
        setItems(j.items ?? []);
      }
    } finally { setLoading(false); }
  }, [gradeId]);

  useEffect(() => { (async () => { const r = await fetch('/api/public/grades'); if (r.ok) { const j = await r.json(); setGrades(j.items ?? []); } })(); }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((x) => !q || x.fullName.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Pengumuman PPDB</h1>
      <div className="grid grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-sm mb-1 text-muted-foreground">Tingkat</label>
          <select className="border border-border rounded-md px-3 py-2 w-full bg-card text-foreground" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
            <option value="">(Semua)</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm mb-1 text-muted-foreground">Cari Nama</label>
          <input className="border border-border rounded-md px-3 py-2 w-full bg-card text-foreground" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {loading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Tingkat</th>
              <th className="text-left p-2 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border-b">{r.fullName}</td>
                <td className="p-2 border-b">{r.gradeApplied?.name ?? '-'}</td>
                <td className="p-2 border-b">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
