"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type Ticket = { id: string; subject: string; status: string; student: { id: string; user: { name?: string | null } } };
type Student = { id: string; user: { name?: string | null } };

export default function CounselingTicketsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ items: Ticket[] }>({
    queryKey: ["counsel-tickets"],
    queryFn: async () => {
      const res = await fetch("/api/counseling/tickets");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Ticket[] };
    },
  });

  const { data: students } = useQuery<{ items: Student[] }>({ queryKey: ["students"], queryFn: async () => (await (await fetch("/api/master/students")).json()) as { items: Student[] } });
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  useEffect(() => { if (!studentId && students?.items?.length) setStudentId(students.items[0].id); }, [students, studentId]);

  const create = useMutation({
    mutationFn: async () => { const res = await fetch("/api/counseling/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, subject }) }); if (!res.ok) throw new Error("Create failed"); },
    onSuccess: () => { setSubject(""); qc.invalidateQueries({ queryKey: ["counsel-tickets"] }); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">BK/Konseling: Tiket</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (!studentId || !subject) return; create.mutate(); }} className="grid grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Siswa</label>
          <select className="border rounded px-3 py-2 w-full" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {students?.items?.map((s) => (
              <option key={s.id} value={s.id}>{s.user?.name ?? s.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Subjek</label>
          <input className="border rounded px-3 py-2 w-full" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" disabled={create.isPending}>Buat Tiket</button>
      </form>

      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Siswa</th>
              <th className="text-left p-2 border-b">Subjek</th>
              <th className="text-left p-2 border-b">Status</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((t) => (
              <tr key={t.id}>
                <td className="p-2 border-b">{t.student.user?.name ?? t.student.id}</td>
                <td className="p-2 border-b">{t.subject}</td>
                <td className="p-2 border-b">{t.status}</td>
                <td className="p-2 border-b"><a className="underline" href={`/counseling/tickets/${t.id}`}>Detail</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
