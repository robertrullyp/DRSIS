"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type Ticket = { id: string; subject: string; status: string; student: { id: string; user: { name?: string | null } } };
type Session = { id: string; startedAt: string; endedAt?: string | null; notes?: string | null; counselor?: { name?: string | null } | null };
type Referral = { id: string; referredTo: string; notes?: string | null; createdAt: string };

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();

  const { data: ticket } = useQuery<Ticket>({ queryKey: ["ticket", id], queryFn: async () => (await (await fetch(`/api/counseling/tickets/${id}`)).json()) as Ticket });
  const { data: sessions } = useQuery<{ items: Session[] }>({ queryKey: ["sessions", id], queryFn: async () => (await (await fetch(`/api/counseling/tickets/${id}/sessions`)).json()) as { items: Session[] } });
  const { data: refs } = useQuery<{ items: Referral[] }>({ queryKey: ["refs", id], queryFn: async () => (await (await fetch(`/api/counseling/tickets/${id}/referrals`)).json()) as { items: Referral[] } });

  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [sessNotes, setSessNotes] = useState("");
  const [sessEnded, setSessEnded] = useState("");
  const [refTo, setRefTo] = useState("");
  const [refNotes, setRefNotes] = useState("");

  const updateTicket = useMutation({
    mutationFn: async () => { const body: any = {}; if (status) body.status = status; if (notes) body.notes = notes; const r = await fetch(`/api/counseling/tickets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!r.ok) throw new Error('Update failed'); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ticket", id] }); setStatus(""); setNotes(""); },
  });
  const createSession = useMutation({
    mutationFn: async () => { const body: any = {}; if (sessNotes) body.notes = sessNotes; if (sessEnded) body.endedAt = sessEnded; const r = await fetch(`/api/counseling/tickets/${id}/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!r.ok) throw new Error('Create failed'); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sessions", id] }); setSessNotes(""); setSessEnded(""); },
  });
  const createReferral = useMutation({
    mutationFn: async () => { const body: any = { referredTo: refTo }; if (refNotes) body.notes = refNotes; const r = await fetch(`/api/counseling/tickets/${id}/referrals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!r.ok) throw new Error('Create failed'); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["refs", id] }); setRefTo(""); setRefNotes(""); },
  });

  return (
    <div className="space-y-4">
      <div className="text-sm"><Link className="underline" href="/counseling/tickets">&larr; Kembali</Link></div>
      <h1 className="text-lg font-semibold">Detail Tiket</h1>
      {ticket ? (
        <div className="space-y-3">
          <div> Siswa: <b>{ticket.student.user?.name ?? ticket.student.id}</b> </div>
          <div> Subjek: {ticket.subject} | Status: {ticket.status} </div>
          <form onSubmit={(e) => { e.preventDefault(); updateTicket.mutate(); }} className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ubah Status</label>
              <select className="border rounded px-3 py-2 w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">(tidak diubah)</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Catatan</label>
              <input className="border rounded px-3 py-2 w-full" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="col-span-3"><button className="border rounded px-3 py-2" disabled={updateTicket.isPending}>Simpan</button></div>
          </form>

          <div className="space-y-2">
            <div className="font-medium">Sesi</div>
            <form onSubmit={(e) => { e.preventDefault(); createSession.mutate(); }} className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Catatan</label>
                <input className="border rounded px-3 py-2 w-full" value={sessNotes} onChange={(e) => setSessNotes(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Selesai</label>
                <input className="border rounded px-3 py-2 w-full" type="datetime-local" value={sessEnded} onChange={(e) => setSessEnded(e.target.value)} />
              </div>
              <div className="col-span-3"><button className="border rounded px-3 py-2" disabled={createSession.isPending}>Tambah Sesi</button></div>
            </form>
            <table className="w-full text-sm border">
              <thead className="bg-muted/50"><tr><th className="text-left p-2 border-b">Dimulai</th><th className="text-left p-2 border-b">Selesai</th><th className="text-left p-2 border-b">Catatan</th></tr></thead>
              <tbody>
                {(sessions?.items ?? []).map((s) => (
                  <tr key={s.id}><td className="p-2 border-b">{new Date(s.startedAt).toLocaleString()}</td><td className="p-2 border-b">{s.endedAt ? new Date(s.endedAt).toLocaleString() : '-'}</td><td className="p-2 border-b">{s.notes ?? '-'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Rujukan</div>
            <form onSubmit={(e) => { e.preventDefault(); if (!refTo) return; createReferral.mutate(); }} className="grid grid-cols-3 gap-2 items-end">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Dirujuk Ke</label>
                <input className="border rounded px-3 py-2 w-full" value={refTo} onChange={(e) => setRefTo(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Catatan</label>
                <input className="border rounded px-3 py-2 w-full" value={refNotes} onChange={(e) => setRefNotes(e.target.value)} />
              </div>
              <div className="col-span-3"><button className="border rounded px-3 py-2" disabled={createReferral.isPending}>Tambah Rujukan</button></div>
            </form>
            <table className="w-full text-sm border">
              <thead className="bg-muted/50"><tr><th className="text-left p-2 border-b">Waktu</th><th className="text-left p-2 border-b">Dirujuk Ke</th><th className="text-left p-2 border-b">Catatan</th></tr></thead>
              <tbody>
                {(refs?.items ?? []).map((r) => (
                  <tr key={r.id}><td className="p-2 border-b">{new Date(r.createdAt).toLocaleString()}</td><td className="p-2 border-b">{r.referredTo}</td><td className="p-2 border-b">{r.notes ?? '-'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (<div>Memuat…</div>)}
    </div>
  );
}

