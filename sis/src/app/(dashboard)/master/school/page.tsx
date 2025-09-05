"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Profile = {
  id?: string;
  name?: string;
  npsn?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  principal?: string | null;
  accreditation?: string | null;
  motto?: string | null;
  vision?: string | null;
  mission?: string | null;
};

export default function SchoolProfilePage() {
  const qc = useQueryClient();
  const session = useSession();
  const roles = (Array.isArray((session.data?.user as any)?.roles) ? (session.data?.user as any).roles : []) as string[];
  const isAdmin = roles.includes("admin");
  const { data } = useQuery<Profile | null>({ queryKey: ["school-profile"], queryFn: async () => (await fetch("/api/school")).json() });

  const [form, setForm] = useState<Profile>({});
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/school", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["school-profile"] }),
  });

  const uploadLogo = async (file: File) => {
    const contentType = file.type || "image/png";
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
    const key = `public/school/logo-${Date.now()}.${ext}`;
    const pres = await fetch(`/api/storage/presign?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`).then((r) => r.json());
    await fetch(pres.url, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    setForm((f) => ({ ...f, logoUrl: key }));
  };

  if (!isAdmin) {
    return <div className="p-4 text-sm text-red-600">403 - Hanya admin yang dapat mengakses halaman ini.</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Profil Sekolah</h1>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Nama Sekolah</label>
          <input className="border rounded px-3 py-2 w-full" value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">NPSN</label>
          <input className="border rounded px-3 py-2 w-full" value={form.npsn ?? ""} onChange={(e) => setForm((f) => ({ ...f, npsn: e.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Alamat</label>
          <input className="border rounded px-3 py-2 w-full" value={form.address ?? ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Telepon</label>
          <input className="border rounded px-3 py-2 w-full" value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Email</label>
          <input className="border rounded px-3 py-2 w-full" type="email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Website</label>
          <input className="border rounded px-3 py-2 w-full" value={form.website ?? ""} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">URL Logo</label>
          <input className="border rounded px-3 py-2 w-full" value={form.logoUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} />
          <div className="mt-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo(file);
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Kepala Sekolah</label>
          <input className="border rounded px-3 py-2 w-full" value={form.principal ?? ""} onChange={(e) => setForm((f) => ({ ...f, principal: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Akreditasi</label>
          <input className="border rounded px-3 py-2 w-full" value={form.accreditation ?? ""} onChange={(e) => setForm((f) => ({ ...f, accreditation: e.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Motto</label>
          <input className="border rounded px-3 py-2 w-full" value={form.motto ?? ""} onChange={(e) => setForm((f) => ({ ...f, motto: e.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Visi</label>
          <textarea className="border rounded px-3 py-2 w-full" rows={3} value={form.vision ?? ""} onChange={(e) => setForm((f) => ({ ...f, vision: e.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Misi</label>
          <textarea className="border rounded px-3 py-2 w-full" rows={4} value={form.mission ?? ""} onChange={(e) => setForm((f) => ({ ...f, mission: e.target.value }))} />
        </div>
      </div>
      <div>
        <button className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
          Simpan Profil
        </button>
      </div>
    </div>
  );
}
