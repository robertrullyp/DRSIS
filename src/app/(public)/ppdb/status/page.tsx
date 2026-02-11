"use client";

import { useState } from "react";

export default function PpdbStatusPage() {
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<{ found: boolean; status?: string; grade?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    setLoading(true);
    try {
      const p = new URLSearchParams({ email });
      if (birthDate) p.set("birthDate", birthDate);
      const res = await fetch(`/api/public/ppdb/status?${p.toString()}`);
      const j = await res.json();
      setResult(j);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Cek Status PPDB</h1>
      <div>
        <label className="block text-sm mb-1 text-muted-foreground">Email pendaftar</label>
        <input className="border border-border rounded-md px-3 py-2 w-full bg-card text-foreground" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm mb-1 text-muted-foreground">Tanggal lahir (opsional)</label>
        <input className="border border-border rounded-md px-3 py-2 w-full bg-card text-foreground" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </div>
      <div>
        <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" onClick={check} disabled={!email || loading}>
          {loading ? "Memeriksa…" : "Periksa"}
        </button>
      </div>
      {result && (
        <div className="rounded-xl p-3 text-sm glass-card">
          {result.found ? (
            <div>
              Status: <b>{result.status}</b>
              <div>Tingkat diterima: {result.grade ?? "-"}</div>
            </div>
          ) : (
            <div>Data pendaftaran tidak ditemukan.</div>
          )}
        </div>
      )}
    </div>
  );
}
