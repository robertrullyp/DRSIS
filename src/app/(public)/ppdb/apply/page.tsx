"use client";

import { useEffect, useMemo, useState } from "react";

type Grade = { id: string; name: string };

function randKey(fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const n = Math.random().toString(36).slice(2, 8);
  return `ppdb/${Date.now()}_${n}_${safe}`;
}

export default function PpdbApplyPublicPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>("");

  // form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gradeAppliedId, setGradeAppliedId] = useState("");
  const [docs, setDocs] = useState<{ name: string; key: string }[]>([]);

  const canSubmit = useMemo(() => fullName && email, [fullName, email]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/public/grades");
        if (res.ok) {
          const j = await res.json();
          setGrades(j.items ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function uploadFile(file: File) {
    const key = randKey(file.name);
    const pres = await fetch(`/api/public/storage/presign?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(file.type || "application/octet-stream")}`);
    if (!pres.ok) throw new Error("presign failed");
    const { url } = await pres.json();
    const put = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
    if (!put.ok) throw new Error("upload failed");
    return { key };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      const payload: any = { fullName, email, phone: phone || undefined, birthDate: birthDate || undefined, gradeAppliedId: gradeAppliedId || undefined };
      if (docs.length) payload.documents = docs;
      const res = await fetch("/api/public/ppdb/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("submit failed");
      setMsg("Pendaftaran berhasil dikirim. Cek email Anda untuk informasi selanjutnya.");
      setFullName(""); setEmail(""); setPhone(""); setBirthDate(""); setGradeAppliedId(""); setDocs([]);
    } catch {
      setMsg("Gagal mengirim pendaftaran.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Form Pendaftaran PPDB</h1>
      {loading ? (
        <div>Memuat…</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Nama Lengkap</label>
            <input className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Email</label>
              <input className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Telepon</label>
              <input className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Tanggal Lahir</label>
              <input className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Tingkat Dituju</label>
              <select className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground" value={gradeAppliedId} onChange={(e) => setGradeAppliedId(e.target.value)}>
                <option value="">(Pilih)</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Dokumen (opsional)</label>
            <input
              type="file"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const { key } = await uploadFile(f);
                  setDocs((d) => [...d, { name: f.name, key }]);
                } catch {
                  setMsg("Gagal upload dokumen");
                } finally {
                  e.currentTarget.value = "";
                }
              }}
            />
            {docs.length > 0 && (
              <ul className="mt-2 text-sm list-disc list-inside">
                {docs.map((d, i) => (
                  <li key={i}>{d.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" disabled={!canSubmit}>Kirim Pendaftaran</button>
          </div>
          {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
        </form>
      )}
    </div>
  );
}
