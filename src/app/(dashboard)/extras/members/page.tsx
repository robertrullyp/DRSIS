"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Extra = { id: string; name: string };
type Member = { id: string; student: { id: string; user: { name?: string | null } } };
type Student = { id: string; user: { name?: string | null } };

export default function ExtrasMembersPage() {
  const qc = useQueryClient();
  const { data: extras } = useQuery<{ items: Extra[] }>({ queryKey: ["extras"], queryFn: async () => (await (await fetch("/api/extras")).json()) as { items: Extra[] } });
  const [extraId, setExtraId] = useState("");
  useEffect(() => { if (!extraId && extras?.items?.length) setExtraId(extras.items[0].id); }, [extras, extraId]);

  const { data: members, isFetching } = useQuery<{ items: Member[] }>({
    queryKey: ["extra-members", extraId],
    queryFn: async () => {
      if (!extraId) return { items: [] as Member[] } as { items: Member[] };
      const res = await fetch(`/api/extras/${extraId}/members`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Member[] };
    },
    enabled: Boolean(extraId),
  });

  const { data: students } = useQuery<{ items: Student[] }>({ queryKey: ["students"], queryFn: async () => (await (await fetch("/api/master/students")).json()) as { items: Student[] } });
  const [studentId, setStudentId] = useState("");
  useEffect(() => { if (!studentId && students?.items?.length) setStudentId(students.items[0].id); }, [students, studentId]);

  const addMember = useMutation({
    mutationFn: async () => { const res = await fetch(`/api/extras/${extraId}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId }) }); if (!res.ok) throw new Error("Add failed"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["extra-members", extraId] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/extras/members/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Delete failed"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["extra-members", extraId] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Ekstrakurikuler: Anggota</h1>
      <div className="grid grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Kegiatan</label>
          <Select value={extraId} onChange={(e) => setExtraId(e.target.value)}>
            {extras?.items?.map((x) => (
              <option key={x.id} value={x.id}>{x.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Siswa</label>
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {students?.items?.map((s) => (
              <option key={s.id} value={s.id}>{s.user?.name ?? s.id}</option>
            ))}
          </Select>
        </div>
        <Button onClick={() => addMember.mutate()} disabled={addMember.isPending || !extraId || !studentId}>Tambah</Button>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(members?.items ?? []).map((m) => (
              <tr key={m.id}>
                <td className="p-2 border-b">{m.student.user?.name ?? m.student.id}</td>
                <td className="p-2 border-b">
                  <Button variant="outline" className="text-xs px-2 py-1" onClick={() => remove.mutate(m.id)} disabled={remove.isPending}>Hapus</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
