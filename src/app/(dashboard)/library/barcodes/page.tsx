"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Item = { id: string; title: string };
type Barcode = { id: string; barcode: string };

export default function LibraryBarcodesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [itemId, setItemId] = useState("");
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [code, setCode] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/library/items");
      if (res.ok) {
        const j = await res.json();
        setItems(j.items ?? []);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!itemId) return;
      const res = await fetch(`/api/library/items/${itemId}/barcodes`);
      if (res.ok) {
        const j = await res.json();
        setBarcodes(j.items ?? []);
      }
    })();
  }, [itemId]);

  async function addBarcode() {
    if (!itemId || !code) return;
    const res = await fetch(`/api/library/items/${itemId}/barcodes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ barcode: code }) });
    if (res.ok) {
      setCode("");
      const j = await (await fetch(`/api/library/items/${itemId}/barcodes`)).json();
      setBarcodes(j.items ?? []);
    }
  }

  async function removeBarcode(id: string) {
    const res = await fetch(`/api/library/barcodes/${id}`, { method: "DELETE" });
    if (res.ok) {
      const j = await (await fetch(`/api/library/items/${itemId}/barcodes`)).json();
      setBarcodes(j.items ?? []);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Perpustakaan: Barcodes</h1>
      <div className="grid grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Koleksi</label>
          <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">(Pilih koleksi)</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>{it.title}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Barcode Baru</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <Button variant="outline" onClick={addBarcode} disabled={!itemId || !code}>Tambah</Button>
      </div>

      <div>
        <h2 className="font-medium mb-2">Daftar Barcode</h2>
        {barcodes.length === 0 ? (
          <div className="text-sm text-muted-foreground">Belum ada barcode</div>
        ) : (
          <table className="w-full text-sm border">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 border-b">Barcode</th>
                <th className="text-left p-2 border-b">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {barcodes.map((b) => (
                <tr key={b.id}>
                  <td className="p-2 border-b">{b.barcode}</td>
                  <td className="p-2 border-b">
                    <Button variant="outline" className="text-xs px-2 py-1" onClick={() => removeBarcode(b.id)}>Hapus</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
