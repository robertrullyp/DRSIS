"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Extra = { id: string; name: string };
type Event = { id: string; title: string; date: string; location?: string | null; result?: string | null };

export default function ExtrasEventsPage() {
  const qc = useQueryClient();
  const { data: extras } = useQuery<{ items: Extra[] }>({ queryKey: ["extras"], queryFn: async () => (await (await fetch("/api/extras")).json()) as { items: Extra[] } });
  const [extraId, setExtraId] = useState("");
  useEffect(() => { if (!extraId && extras?.items?.length) setExtraId(extras.items[0].id); }, [extras, extraId]);

  const { data: evs, isFetching } = useQuery<{ items: Event[] }>({
    queryKey: ["extra-events", extraId],
    queryFn: async () => {
      if (!extraId) return { items: [] as Event[] } as any;
      const res = await fetch(`/api/extras/${extraId}/events`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Event[] };
    },
    enabled: Boolean(extraId),
  });

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/extras/${extraId}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, date, location: location || undefined, result: result || undefined }) });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => { setTitle(""); setDate(""); setLocation(""); setResult(""); qc.invalidateQueries({ queryKey: ["extra-events", extraId] }); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Ekstrakurikuler: Event</h1>
      <div className="grid grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Kegiatan</label>
          <Select value={extraId} onChange={(e) => setExtraId(e.target.value)}>
            {extras?.items?.map((x) => (
              <option key={x.id} value={x.id}>{x.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Judul</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tanggal</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Lokasi</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <Button disabled={create.isPending || !extraId || !title || !date}>Tambah</Button>
      </div>

      {isFetching ? (
        <div>Memuat…</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Judul</th>
              <th className="text-left p-2 border-b">Tanggal</th>
              <th className="text-left p-2 border-b">Lokasi</th>
              <th className="text-left p-2 border-b">Hasil</th>
            </tr>
          </thead>
          <tbody>
            {(evs?.items ?? []).map((e) => (
              <tr key={e.id}>
                <td className="p-2 border-b">{e.title}</td>
                <td className="p-2 border-b">{new Date(e.date).toLocaleDateString()}</td>
                <td className="p-2 border-b">{e.location ?? "-"}</td>
                <td className="p-2 border-b">{e.result ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
