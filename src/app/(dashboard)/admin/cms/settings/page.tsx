"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

type CmsSettingsPayload = {
  siteTitle?: string;
  siteTagline?: string;
  homeHeroTitle?: string;
  homeHeroSubtitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  announcementBanner?: string;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
};

const initialState: CmsSettingsPayload = {
  siteTitle: "",
  siteTagline: "",
  homeHeroTitle: "",
  homeHeroSubtitle: "",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  announcementBanner: "",
  primaryCtaLabel: "",
  primaryCtaUrl: "",
  secondaryCtaLabel: "",
  secondaryCtaUrl: "",
};

export default function AdminCmsSettingsPage() {
  const [form, setForm] = useState<CmsSettingsPayload>(initialState);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settingsQuery = useQuery<CmsSettingsPayload>({
    queryKey: ["admin-cms-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cms/settings");
      if (!res.ok) throw new Error("Gagal memuat settings");
      return (await res.json()) as CmsSettingsPayload;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CmsSettingsPayload) => {
      const res = await fetch("/api/admin/cms/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(typeof body?.error === "string" ? body.error : "Gagal menyimpan settings");
      }
    },
    onSuccess: () => {
      setNotice("Settings CMS berhasil disimpan.");
      setError(null);
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message);
      setNotice(null);
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setForm({
      siteTitle: settingsQuery.data.siteTitle ?? "",
      siteTagline: settingsQuery.data.siteTagline ?? "",
      homeHeroTitle: settingsQuery.data.homeHeroTitle ?? "",
      homeHeroSubtitle: settingsQuery.data.homeHeroSubtitle ?? "",
      contactEmail: settingsQuery.data.contactEmail ?? "",
      contactPhone: settingsQuery.data.contactPhone ?? "",
      contactAddress: settingsQuery.data.contactAddress ?? "",
      announcementBanner: settingsQuery.data.announcementBanner ?? "",
      primaryCtaLabel: settingsQuery.data.primaryCtaLabel ?? "",
      primaryCtaUrl: settingsQuery.data.primaryCtaUrl ?? "",
      secondaryCtaLabel: settingsQuery.data.secondaryCtaLabel ?? "",
      secondaryCtaUrl: settingsQuery.data.secondaryCtaUrl ?? "",
    });
  }, [settingsQuery.data]);

  function setField<K extends keyof CmsSettingsPayload>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    saveMutation.mutate(form);
  }

  if (settingsQuery.isLoading) {
    return <div>Memuat settings CMS...</div>;
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">CMS Settings</h1>
        <p className="text-sm text-muted-foreground">Pengaturan tampilan dan call-to-action pada portal publik.</p>
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        <section className="neo-card grid gap-3 p-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs text-muted-foreground">Banner pengumuman</span>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.announcementBanner || ""}
              onChange={(event) => setField("announcementBanner", event.target.value)}
              placeholder="Contoh: PPDB Gelombang 2 dibuka sampai 30 Juni"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Judul situs</span>
            <input className="w-full rounded-md border px-3 py-2" value={form.siteTitle || ""} onChange={(event) => setField("siteTitle", event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Tagline situs</span>
            <input className="w-full rounded-md border px-3 py-2" value={form.siteTagline || ""} onChange={(event) => setField("siteTagline", event.target.value)} />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs text-muted-foreground">Hero title</span>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.homeHeroTitle || ""}
              onChange={(event) => setField("homeHeroTitle", event.target.value)}
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs text-muted-foreground">Hero subtitle</span>
            <textarea
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              value={form.homeHeroSubtitle || ""}
              onChange={(event) => setField("homeHeroSubtitle", event.target.value)}
            />
          </label>
        </section>

        <section className="neo-card grid gap-3 p-4 sm:grid-cols-2">
          <h2 className="sm:col-span-2 text-sm font-medium">Kontak Publik</h2>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              className="w-full rounded-md border px-3 py-2"
              value={form.contactEmail || ""}
              onChange={(event) => setField("contactEmail", event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Telepon</span>
            <input className="w-full rounded-md border px-3 py-2" value={form.contactPhone || ""} onChange={(event) => setField("contactPhone", event.target.value)} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs text-muted-foreground">Alamat</span>
            <textarea
              className="w-full rounded-md border px-3 py-2"
              rows={2}
              value={form.contactAddress || ""}
              onChange={(event) => setField("contactAddress", event.target.value)}
            />
          </label>
        </section>

        <section className="neo-card grid gap-3 p-4 sm:grid-cols-2">
          <h2 className="sm:col-span-2 text-sm font-medium">Call To Action</h2>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">CTA utama label</span>
            <input className="w-full rounded-md border px-3 py-2" value={form.primaryCtaLabel || ""} onChange={(event) => setField("primaryCtaLabel", event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">CTA utama URL</span>
            <input className="w-full rounded-md border px-3 py-2" value={form.primaryCtaUrl || ""} onChange={(event) => setField("primaryCtaUrl", event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">CTA sekunder label</span>
            <input className="w-full rounded-md border px-3 py-2" value={form.secondaryCtaLabel || ""} onChange={(event) => setField("secondaryCtaLabel", event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">CTA sekunder URL</span>
            <input className="w-full rounded-md border px-3 py-2" value={form.secondaryCtaUrl || ""} onChange={(event) => setField("secondaryCtaUrl", event.target.value)} />
          </label>
        </section>

        {notice ? <p className="text-sm text-green-700">{notice}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Menyimpan..." : "Simpan Settings"}
        </button>
      </form>
    </div>
  );
}
