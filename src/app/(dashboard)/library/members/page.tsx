"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Member = { id: string; joinedAt: string; user?: { id: string; name?: string | null; email?: string } | null; student?: { id: string; user: { name?: string | null; email?: string | null } } | null };
type Student = { id: string; user: { name?: string | null } };

export default function LibraryMembersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ items: Member[] }>({
    queryKey: ["lib-members"],
    queryFn: async () => {
      const res = await fetch("/api/library/members");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Member[] };
    },
  });

  const { data: students } = useQuery<{ items: Student[] }>({
    queryKey: ["students-options"],
    queryFn: async () => {
      const res = await fetch("/api/master/students");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Student[] };
    },
  });

  const [studentId, setStudentId] = useState("");
  useEffect(() => { if (!studentId && students?.items?.length) setStudentId(students.items[0].id); }, [students, studentId]);

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/library/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId }) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lib-members"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Perpustakaan: Anggota</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (!studentId) return; create.mutate(); }} className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Siswa</label>
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {students?.items?.map((s) => (
              <option key={s.id} value={s.id}>{s.user?.name ?? s.id}</option>
            ))}
          </Select>
        </div>
        <Button disabled={create.isPending}>Tambah</Button>
      </form>

      {isLoading ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Email</th>
              <th className="text-left p-2 border-b">Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((m) => {
              const name = m.student?.user?.name ?? m.user?.name ?? m.id;
              const email = m.student?.user?.email ?? m.user?.email ?? "-";
              return (
                <tr key={m.id}>
                  <td className="p-2 border-b">{name}</td>
                  <td className="p-2 border-b">{email}</td>
                  <td className="p-2 border-b">{new Date(m.joinedAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
