"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Grade = { id: string; name: string };
type AppItem = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  birthDate?: string | null;
  status: string;
  score?: number | null;
  notes?: string | null;
  gradeApplied?: Grade | null;
  documents?: { name?: string; key?: string }[] | null;
};

export default function PpdbApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const { data, isFetching } = useQuery<AppItem>({
    queryKey: ["ppdb-app", id],
    queryFn: async () => {
      const res = await fetch(`/api/ppdb/applications/${id}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as AppItem;
    },
  });

  const [score, setScore] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const update = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      if (score !== "") payload.score = Number(score);
      if (notes !== "") payload.notes = notes;
      const res = await fetch(`/api/ppdb/applications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ppdb-app", id] }),
  });

  const verify = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ppdb/applications/${id}/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified: true }) });
      if (!res.ok) throw new Error("Verify failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ppdb-app", id] }),
  });

  const decide = useMutation({
    mutationFn: async (decision: "ACCEPTED" | "REJECTED") => {
      const res = await fetch(`/api/ppdb/applications/${id}/decide`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, autoEnroll: true }) });
      if (!res.ok) throw new Error("Decide failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ppdb-app", id] }),
  });

  async function viewDoc(key?: string | null) {
    if (!key) return;
    const res = await fetch(`/api/storage/presign-get?key=${encodeURIComponent(key)}`);
    if (!res.ok) return;
    const { url } = await res.json();
    window.open(url, "_blank");
  }

  const header = useMemo(() => ({ title: data?.fullName ?? "Detail Pendaftar" }), [data]);

  return (
    <div className="space-y-4">
      <div className="text-sm"><Link className="underline" href="/ppdb/applications">&larr; Kembali</Link></div>
      <h1 className="text-lg font-semibold">{header.title}</h1>
      {isFetching ? (
        <div>Memuat…</div>
      ) : data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div>{data.email}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Telepon</div>
              <div>{data.phone ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tanggal Lahir</div>
              <div>{data.birthDate ? new Date(data.birthDate).toLocaleDateString() : "-"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tingkat Dituju</div>
              <div>{data.gradeApplied?.name ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div>{data.status}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Skor</div>
              <div>{typeof data.score === "number" ? data.score : "-"}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Dokumen</div>
            {data.documents && data.documents.length > 0 ? (
              <ul className="list-disc list-inside text-sm">
                {data.documents.map((d, idx) => (
                  <li key={idx}>
                    <button className="underline" onClick={() => viewDoc(d.key)}>{d.name ?? d.key}</button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">Tidak ada dokumen</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Skor</label>
              <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Catatan</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="col-span-3 space-x-2">
              <Button variant="outline" onClick={() => update.mutate()} disabled={update.isPending}>Simpan</Button>
              <Button variant="outline" onClick={() => verify.mutate()} disabled={verify.isPending || data.status !== "PENDING"}>Verify</Button>
              <Button variant="outline" onClick={() => decide.mutate("ACCEPTED")} disabled={decide.isPending || (data.status !== "VERIFIED" && data.status !== "ACCEPTED")}>Accept</Button>
              <Button variant="outline" onClick={() => decide.mutate("REJECTED")} disabled={decide.isPending || data.status === "REJECTED"}>Reject</Button>
            </div>
          </div>
        </div>
      ) : (
        <div>Tidak ditemukan</div>
      )}
    </div>
  );
}
