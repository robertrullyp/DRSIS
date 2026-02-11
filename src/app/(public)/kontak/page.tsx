"use client";

import { FormEvent, useState } from "react";

export default function PublicContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);
    setError(null);

    const res = await fetch("/api/public/cms/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: email || undefined,
        phone: phone || undefined,
        subject: subject || undefined,
        message,
        _company: company || undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Gagal mengirim pesan.");
      return;
    }

    setNotice("Pesan berhasil dikirim. Tim sekolah akan menindaklanjuti.");
    setName("");
    setEmail("");
    setPhone("");
    setSubject("");
    setMessage("");
    setCompany("");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Portal Publik</p>
        <h1 className="text-3xl font-semibold leading-tight">Hubungi Kami</h1>
        <p className="text-sm text-muted-foreground">Sampaikan pertanyaan, masukan, atau kebutuhan informasi melalui formulir berikut.</p>
      </header>

      <form className="neo-card space-y-4 p-5 sm:p-6" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Nama</label>
            <input className="w-full rounded-md border px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Subjek</label>
            <input className="w-full rounded-md border px-3 py-2" value={subject} onChange={(event) => setSubject(event.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Email</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@domain.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Telepon</label>
            <input className="w-full rounded-md border px-3 py-2" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08xxxxxxxxxx" />
          </div>
        </div>

        <div style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
          <label htmlFor="company">Company</label>
          <input id="company" tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Pesan</label>
          <textarea className="w-full rounded-md border px-3 py-2" rows={8} value={message} onChange={(event) => setMessage(event.target.value)} required />
        </div>

        {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" disabled={isSubmitting}>
          {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
        </button>
      </form>
    </main>
  );
}
