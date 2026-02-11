"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Tpl = { id: string; key: string; subject: string; content: string };

export default function EmailTemplatesPage() {
  const qc = useQueryClient();
  const { data } = useQuery<{ items: Tpl[] }>({ queryKey: ["email-templates"], queryFn: async () => (await fetch("/api/admin/email/templates")).json() });
  const [key, setKey] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [testTo, setTestTo] = useState("");
  const [testKey, setTestKey] = useState("");
  const [testSubject, setTestSubject] = useState("Test Email");
  const [testPayload, setTestPayload] = useState("{\n  \"startDate\": \"2025-01-01\",\n  \"endDate\": \"2025-01-03\",\n  \"days\": 3,\n  \"type\": \"Dinas\"\n}");

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/email/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, subject, content }) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => { setKey(""); setSubject(""); setContent(""); qc.invalidateQueries({ queryKey: ["email-templates"] }); },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/admin/email/templates/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Delete failed"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
  const seed = useMutation({
    mutationFn: async () => { const res = await fetch("/api/admin/notify/seed-templates", { method: "POST" }); if (!res.ok) throw new Error("Seed failed"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });
  const sendTest = useMutation({
    mutationFn: async () => { const res = await fetch("/api/admin/email/send-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: testTo, key: testKey || key, subject: testSubject, payload: testPayload }) }); if (!res.ok) throw new Error("Send test failed"); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Admin: Email Templates</h1>
      <div className="flex gap-2">
        <button className="rounded-md px-3 py-2 border border-border hover:bg-muted" onClick={() => seed.mutate()} disabled={seed.isPending}>Seed Default Templates</button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (!key || !subject || !content) return; create.mutate(); }} className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Key</label>
          <input className="border rounded px-3 py-2 w-full" value={key} onChange={(e) => setKey(e.target.value)} placeholder="mis. leave.approved" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Subject</label>
          <input className="border rounded px-3 py-2 w-full" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject email" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Content</label>
          <textarea className="border rounded px-3 py-2 w-full" rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Gunakan token: {{name}}, {{startDate}}" />
        </div>
        <div className="md:col-span-2">
          <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" disabled={create.isPending}>Tambah</button>
        </div>
      </form>

      <div className="rounded-xl p-4 glass-card space-y-2">
        <div className="font-medium">Send Test</div>
        <div className="grid md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email (to)</label>
            <input className="border rounded px-3 py-2 w-full" placeholder="user@example.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Key Template</label>
            <input className="border rounded px-3 py-2 w-full" placeholder="leave.approved" value={testKey} onChange={(e) => setTestKey(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Subject</label>
            <input className="border rounded px-3 py-2 w-full" value={testSubject} onChange={(e) => setTestSubject(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs text-gray-600 mb-1">Payload JSON</label>
            <textarea className="border rounded px-3 py-2 w-full" rows={4} value={testPayload} onChange={(e) => setTestPayload(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" onClick={() => sendTest.mutate()} disabled={sendTest.isPending}>Kirim Test</button>
          </div>
        </div>
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2 border-b">Key</th>
            <th className="text-left p-2 border-b">Subject</th>
            <th className="text-left p-2 border-b">Content</th>
            <th className="text-left p-2 border-b">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((t) => (
            <tr key={t.id}>
              <td className="p-2 border-b">{t.key}</td>
              <td className="p-2 border-b">{t.subject}</td>
              <td className="p-2 border-b whitespace-pre-wrap">{t.content}</td>
              <td className="p-2 border-b">
                <button className="text-xs px-2 py-1 rounded border border-red-600 text-red-700" onClick={() => remove.mutate(t.id)} disabled={remove.isPending}>Hapus</button>
              </td>
            </tr>
          ))}
          {(data?.items?.length ?? 0) === 0 && (
            <tr><td className="p-2" colSpan={4}>Belum ada template.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
