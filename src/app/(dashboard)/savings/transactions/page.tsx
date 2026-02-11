"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Account = { id: string; balance: number; student: { user: { name?: string | null } } };
type Txn = { id: string; type: string; amount: number; createdAt: string; approvedBy?: string | null };

export default function SavingsTransactionsPage() {
  const qc = useQueryClient();
  const { data: accounts } = useQuery<{ items: Account[] }>({ queryKey: ["savings-accounts"], queryFn: async () => (await (await fetch("/api/savings/accounts")).json()) as { items: Account[] } });
  const [accountId, setAccountId] = useState("");
  useEffect(() => { if (!accountId && accounts?.items?.length) setAccountId(accounts.items[0].id); }, [accounts, accountId]);

  const { data: txns } = useQuery<{ items: Txn[] }>({ queryKey: ["savings-txns", accountId], queryFn: async () => (await (await fetch(`/api/savings/transactions?accountId=${accountId}`)).json()) as { items: Txn[] }, enabled: Boolean(accountId) });
  const [start, setStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10); });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0,10));
  const params = useMemo(() => new URLSearchParams({ accountId, start, end }).toString(), [accountId, start, end]);
  const { data: txnsPeriod } = useQuery<{ items: Txn[] }>({ queryKey: ["savings-txns", params], queryFn: async () => (await (await fetch(`/api/savings/transactions?${params}`)).json()) as { items: Txn[] }, enabled: Boolean(accountId) });
  const { data: summary } = useQuery<{ opening: number; inflow: number; outflow: number; closing: number }>({ queryKey: ["savings-summary", params], queryFn: async () => (await (await fetch(`/api/savings/accounts/${accountId}/summary?start=${start}&end=${end}`)).json()) as any, enabled: Boolean(accountId) });

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("DEPOSIT");
  const submit = useMutation({
    mutationFn: async () => { const body: any = { accountId, type, amount: Number(amount) }; const res = await fetch("/api/savings/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!res.ok) throw new Error("Txn failed"); },
    onSuccess: () => { setAmount(""); qc.invalidateQueries({ queryKey: ["savings-accounts"] }); qc.invalidateQueries({ queryKey: ["savings-txns", accountId] }); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Tabungan: Transaksi</h1>
      <div className="grid grid-cols-6 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Akun</label>
          <select className="border rounded px-3 py-2 w-full" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts?.items?.map((a) => (<option key={a.id} value={a.id}>{a.student.user?.name ?? a.id} (Saldo: {a.balance})</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Jenis</label>
          <select className="border rounded px-3 py-2 w-full" value={type} onChange={(e) => setType(e.target.value)}>
            <option>DEPOSIT</option>
            <option>WITHDRAWAL</option>
            <option>ADJUSTMENT</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nominal</label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Button onClick={() => submit.mutate()} disabled={submit.isPending || !accountId || !amount}>Simpan</Button>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Periode Mulai</label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Periode Selesai</label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end mb-2">
        <Button variant="outline" onClick={async () => {
          const p = new URLSearchParams({ accountId, start, end });
          const res = await fetch(`/api/savings/transactions/export?${p.toString()}`);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = `savings_${accountId}.csv`; a.click(); URL.revokeObjectURL(url);
        }}>Export 30 hari</Button>
        <Button variant="outline" onClick={async () => {
          const p = new URLSearchParams({ start, end });
          window.open(`/api/savings/accounts/${accountId}/book-period?${p.toString()}`, '_blank');
        }}>Buku PDF 30 hari</Button>
      </div>
      {summary && (
        <div className="text-sm text-foreground/80">Saldo awal: {summary.opening} | Masuk: {summary.inflow} | Keluar: {summary.outflow} | Saldo akhir: {summary.closing}</div>
      )}
      <table className="w-full text-sm border">
        <thead className="bg-muted/50"><tr><th className="text-left p-2 border-b">Waktu</th><th className="text-left p-2 border-b">Jenis</th><th className="text-left p-2 border-b">Nominal</th><th className="text-left p-2 border-b">Status</th><th className="text-left p-2 border-b">Aksi</th></tr></thead>
        <tbody>
          {(txnsPeriod?.items ?? txns?.items ?? []).map((t) => (
            <tr key={t.id}>
              <td className="p-2 border-b">{new Date(t.createdAt).toLocaleString()}</td>
              <td className="p-2 border-b">{t.type}</td>
              <td className="p-2 border-b">{t.amount}</td>
              <td className="p-2 border-b">{t.type === 'WITHDRAWAL' ? (t.approvedBy ? 'APPROVED' : 'PENDING') : 'APPROVED'}</td>
              <td className="p-2 border-b space-x-2">
                {t.type === 'WITHDRAWAL' && !t.approvedBy && (
                  <>
                    <Button variant="outline" onClick={async () => { await fetch(`/api/savings/transactions/${t.id}/approve`, { method: 'POST' }); qc.invalidateQueries({ queryKey: ["savings-accounts"] }); qc.invalidateQueries({ queryKey: ["savings-txns", accountId] }); }}>Approve</Button>
                    <Button variant="outline" onClick={async () => { await fetch(`/api/savings/transactions/${t.id}/reject`, { method: 'POST' }); qc.invalidateQueries({ queryKey: ["savings-txns", accountId] }); }}>Reject</Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
