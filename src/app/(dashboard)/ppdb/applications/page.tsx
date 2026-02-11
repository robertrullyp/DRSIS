"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Grade = { id: string; name: string };
type AppRow = { id: string; fullName: string; email: string; phone?: string | null; status: string; score?: number | null; gradeApplied?: { id: string; name: string } | null };

export default function PpdbApplicationsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const { data: grades } = useQuery<{ items: Grade[] }>({
    queryKey: ["grades"],
    queryFn: async () => {
      const res = await fetch("/api/master/grades");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Grade[] };
    },
  });

  const { data, isFetching } = useQuery<{ items: AppRow[]; total: number; page: number; pageSize: number }>({
    queryKey: ["ppdb-apps", q, status, page, pageSize],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (q) p.set("q", q);
      if (status) p.set("status", status);
      const res = await fetch(`/api/ppdb/applications?${p.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: AppRow[]; total: number; page: number; pageSize: number };
    },
  });

  const create = useMutation({
    mutationFn: async (payload: { fullName: string; email: string; phone?: string; gradeAppliedId?: string }) => {
      const res = await fetch("/api/ppdb/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ppdb-apps"] }),
  });

  const verify = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ppdb/applications/${id}/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified: true }) });
      if (!res.ok) throw new Error("Verify failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ppdb-apps"] }),
  });

  const decide = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: "ACCEPTED" | "REJECTED" }) => {
      const res = await fetch(`/api/ppdb/applications/${id}/decide`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, autoEnroll: true }) });
      if (!res.ok) throw new Error("Decision failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ppdb-apps"] }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  // quick create form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gradeAppliedId, setGradeAppliedId] = useState("");

  const canCreate = useMemo(() => fullName && email, [fullName, email]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">PPDB: Pendaftaran</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canCreate) return;
          create.mutate({ fullName, email, phone: phone || undefined, gradeAppliedId: gradeAppliedId || undefined });
          setFullName(""); setEmail(""); setPhone(""); setGradeAppliedId("");
        }}
        className="grid grid-cols-5 gap-2 items-end"
      >
        <div>
          <label className="block text-xs text-gray-600 mb-1">Nama</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Phone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tingkat</label>
          <select className="border rounded px-3 py-2 w-full" value={gradeAppliedId} onChange={(e) => setGradeAppliedId(e.target.value)}>
            <option value="">(tidak ditentukan)</option>
            {grades?.items?.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <Button disabled={!canCreate || create.isPending}>Tambah</Button>
      </form>

      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Cari</label>
          <input className="border rounded px-3 py-2" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Status</label>
          <select className="border rounded px-3 py-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">(semua)</option>
            {(["PENDING","VERIFIED","ACCEPTED","REJECTED","ENROLLED"] as const).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-600">Total: {data?.total ?? 0} | Halaman {data?.page ?? page} dari {totalPages}</div>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Nama</th>
              <th className="text-left p-2 border-b">Email</th>
              <th className="text-left p-2 border-b">Tingkat</th>
              <th className="text-left p-2 border-b">Status</th>
              <th className="text-left p-2 border-b">Skor</th>
              <th className="text-left p-2 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((a) => (
              <tr key={a.id}>
                <td className="p-2 border-b"><a className="underline" href={`/ppdb/applications/${a.id}`}>{a.fullName}</a></td>
                <td className="p-2 border-b">{a.email}</td>
                <td className="p-2 border-b">{a.gradeApplied?.name ?? "-"}</td>
                <td className="p-2 border-b">{a.status}</td>
                <td className="p-2 border-b">{a.score ?? "-"}</td>
                <td className="p-2 border-b space-x-2">
                  <Button variant="outline" className="text-xs px-2 py-1" onClick={() => verify.mutate(a.id)} disabled={verify.isPending || a.status !== "PENDING"}>Verify</Button>
                  <Button variant="outline" className="text-xs px-2 py-1" onClick={() => decide.mutate({ id: a.id, decision: "ACCEPTED" })} disabled={decide.isPending || (a.status !== "VERIFIED" && a.status !== "ACCEPTED")}>Accept</Button>
                  <Button variant="outline" className="text-xs px-2 py-1" onClick={() => decide.mutate({ id: a.id, decision: "REJECTED" })} disabled={decide.isPending || a.status === "REJECTED"}>Reject</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-end gap-2">
        <button className="border rounded px-3 py-1 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <button className="border rounded px-3 py-1 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
