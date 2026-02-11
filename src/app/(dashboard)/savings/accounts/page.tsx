"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Student = { id: string; user: { name?: string | null } };
type Account = { id: string; balance: number; student: Student };

export default function SavingsAccountsPage() {
  const qc = useQueryClient();
  const { data: students } = useQuery<{ items: Student[] }>({ queryKey: ["students"], queryFn: async () => (await (await fetch("/api/master/students")).json()) as { items: Student[] } });
  const { data, isLoading } = useQuery<{ items: Account[] }>({ queryKey: ["savings-accounts"], queryFn: async () => (await (await fetch("/api/savings/accounts")).json()) as { items: Account[] } });

  const [studentId, setStudentId] = useState("");
  useEffect(() => { if (!studentId && students?.items?.length) setStudentId(students.items[0].id); }, [students, studentId]);

  const create = useMutation({
    mutationFn: async () => { const res = await fetch("/api/savings/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId }) }); if (!res.ok) throw new Error("Create failed"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-accounts"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Tabungan: Akun</h1>
      <div className="grid grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Siswa</label>
          <select className="border rounded px-3 py-2 w-full" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {students?.items?.map((s) => (<option key={s.id} value={s.id}>{s.user?.name ?? s.id}</option>))}
          </select>
        </div>
        <Button onClick={() => create.mutate()} disabled={create.isPending || !studentId}>Buat Akun</Button>
      </div>

      {isLoading ? <div>Memuat…</div> : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-50"><tr><th className="text-left p-2 border-b">Siswa</th><th className="text-left p-2 border-b">Saldo</th><th className="text-left p-2 border-b">Aksi</th></tr></thead>
          <tbody>
            {(data?.items ?? []).map((a) => (
              <tr key={a.id}>
                <td className="p-2 border-b">{a.student.user?.name ?? a.student.id}</td>
                <td className="p-2 border-b">{a.balance}</td>
                <td className="p-2 border-b"><Button variant="outline" onClick={() => window.open(`/api/savings/accounts/${a.id}/book`, '_blank')}>Buku</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
