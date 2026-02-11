"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type GuardianRelationType = "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER";

type StudentGuardianLink = {
  id: string;
  relation: GuardianRelationType;
  isPrimary: boolean;
  guardianUser: {
    id: string;
    name?: string | null;
    email: string;
    role?: { name: string } | null;
  };
};

type Student = {
  id: string;
  nis?: string | null;
  nisn?: string | null;
  gender?: string | null;
  photoUrl?: string | null;
  user: { name?: string | null; email: string };
  guardians: StudentGuardianLink[];
};

type GuardianDraft = {
  email: string;
  relation: GuardianRelationType;
  isPrimary: boolean;
};

const defaultGuardianDraft: GuardianDraft = {
  email: "",
  relation: "GUARDIAN",
  isPrimary: false,
};

function relationLabel(value: GuardianRelationType) {
  if (value === "FATHER") return "Ayah";
  if (value === "MOTHER") return "Ibu";
  if (value === "GUARDIAN") return "Wali";
  return "Lainnya";
}

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<{ items: Student[] }>({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/master/students");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Student[] };
    },
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nis, setNis] = useState("");
  const [nisn, setNisn] = useState("");
  const [gender, setGender] = useState("");
  const [guardianDrafts, setGuardianDrafts] = useState<Record<string, GuardianDraft>>({});

  const getGuardianDraft = (studentId: string) => guardianDrafts[studentId] ?? defaultGuardianDraft;

  const setGuardianDraft = (studentId: string, patch: Partial<GuardianDraft>) => {
    setGuardianDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...defaultGuardianDraft,
        ...(prev[studentId] ?? {}),
        ...patch,
      },
    }));
  };

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/master/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          nis: nis || undefined,
          nisn: nisn || undefined,
          gender: (gender || undefined) as "MALE" | "FEMALE" | "OTHER" | undefined,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => {
      setName("");
      setEmail("");
      setNis("");
      setNisn("");
      setGender("");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await fetch(`/api/master/students/${studentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });

  const addGuardian = useMutation({
    mutationFn: async ({ studentId, draft }: { studentId: string; draft: GuardianDraft }) => {
      const res = await fetch(`/api/master/students/${studentId}/guardians`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardianEmail: draft.email,
          relation: draft.relation,
          isPrimary: draft.isPrimary,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error ?? "Gagal menambahkan relasi wali");
      }
    },
    onSuccess: (_, variables) => {
      setGuardianDrafts((prev) => ({
        ...prev,
        [variables.studentId]: { ...defaultGuardianDraft },
      }));
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const removeGuardian = useMutation({
    mutationFn: async ({ studentId, linkId }: { studentId: string; linkId: string }) => {
      const res = await fetch(`/api/master/students/${studentId}/guardians/${linkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus relasi wali");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });

  const setPrimaryGuardian = useMutation({
    mutationFn: async ({ studentId, linkId }: { studentId: string; linkId: string }) => {
      const res = await fetch(`/api/master/students/${studentId}/guardians/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      if (!res.ok) throw new Error("Gagal mengatur wali utama");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Master: Siswa</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name || !email) return;
          create.mutate();
        }}
        className="grid grid-cols-1 items-end gap-2 md:grid-cols-6"
      >
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Nama</label>
          <input className="w-full rounded border px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Email</label>
          <input className="w-full rounded border px-3 py-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">NIS (opsional)</label>
          <input className="w-full rounded border px-3 py-2" value={nis} onChange={(event) => setNis(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">NISN (opsional)</label>
          <input className="w-full rounded border px-3 py-2" value={nisn} onChange={(event) => setNisn(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Gender (opsional)</label>
          <select className="w-full rounded border px-3 py-2" value={gender} onChange={(event) => setGender(event.target.value)}>
            <option value="">(tidak ditentukan)</option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <button className="rounded-md bg-accent px-4 py-2 text-accent-foreground hover:opacity-90" disabled={create.isPending}>Tambah</button>
      </form>

      {isLoading ? (
        <div>Memuat...</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-[1100px] border text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b p-2 text-left">Nama</th>
                <th className="border-b p-2 text-left">Email</th>
                <th className="border-b p-2 text-left">NIS</th>
                <th className="border-b p-2 text-left">NISN</th>
                <th className="border-b p-2 text-left">Gender</th>
                <th className="border-b p-2 text-left">Ortu/Wali</th>
                <th className="border-b p-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((student) => {
                const draft = getGuardianDraft(student.id);
                return (
                  <tr key={student.id}>
                    <td className="border-b p-2">
                      <div className="flex items-center gap-2">
                        {student.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/storage/presign-get?key=${encodeURIComponent(student.photoUrl)}`}
                            alt="Foto"
                            className="h-8 w-8 rounded bg-white object-cover"
                          />
                        ) : null}
                        <span>{student.user?.name ?? "-"}</span>
                      </div>
                    </td>
                    <td className="border-b p-2">{student.user?.email}</td>
                    <td className="border-b p-2">{student.nis ?? "-"}</td>
                    <td className="border-b p-2">{student.nisn ?? "-"}</td>
                    <td className="border-b p-2">{student.gender ?? "-"}</td>
                    <td className="border-b p-2">
                      <div className="space-y-2">
                        {student.guardians.length === 0 ? (
                          <div className="text-xs text-muted-foreground">Belum ada relasi ortu/wali</div>
                        ) : (
                          student.guardians.map((link) => (
                            <div key={link.id} className="rounded border p-2 text-xs">
                              <div className="font-medium">{link.guardianUser.name ?? "-"} ({link.guardianUser.email})</div>
                              <div className="text-muted-foreground">{relationLabel(link.relation)}{link.isPrimary ? " • Utama" : ""} • Role {link.guardianUser.role?.name ?? "-"}</div>
                              <div className="mt-2 flex gap-2">
                                {!link.isPrimary ? (
                                  <button
                                    type="button"
                                    className="rounded border px-2 py-1"
                                    onClick={() => setPrimaryGuardian.mutate({ studentId: student.id, linkId: link.id })}
                                    disabled={setPrimaryGuardian.isPending}
                                  >
                                    Jadikan Utama
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="rounded border border-red-500 px-2 py-1 text-red-600"
                                  onClick={() => removeGuardian.mutate({ studentId: student.id, linkId: link.id })}
                                  disabled={removeGuardian.isPending}
                                >
                                  Lepas
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                        <div className="grid grid-cols-1 gap-2 rounded border p-2 md:grid-cols-4">
                          <input
                            className="rounded border px-2 py-1 md:col-span-2"
                            placeholder="Email ortu/wali"
                            value={draft.email}
                            onChange={(event) => setGuardianDraft(student.id, { email: event.target.value })}
                          />
                          <select
                            className="rounded border px-2 py-1"
                            value={draft.relation}
                            onChange={(event) => setGuardianDraft(student.id, { relation: event.target.value as GuardianRelationType })}
                          >
                            <option value="FATHER">Ayah</option>
                            <option value="MOTHER">Ibu</option>
                            <option value="GUARDIAN">Wali</option>
                            <option value="OTHER">Lainnya</option>
                          </select>
                          <button
                            type="button"
                            className="rounded border bg-accent px-2 py-1 text-accent-foreground"
                            onClick={() => addGuardian.mutate({ studentId: student.id, draft })}
                            disabled={addGuardian.isPending || !draft.email}
                          >
                            Tambah Relasi
                          </button>
                          <label className="md:col-span-4 inline-flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={draft.isPrimary}
                              onChange={(event) => setGuardianDraft(student.id, { isPrimary: event.target.checked })}
                            />
                            Set sebagai wali utama
                          </label>
                        </div>
                      </div>
                    </td>
                    <td className="border-b p-2 align-top">
                      <div className="space-y-2">
                        <label className="inline-block cursor-pointer rounded border px-2 py-1 text-xs hover:bg-muted">
                          Upload Foto
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              const contentType = file.type || "image/jpeg";
                              const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
                              const key = `public/students/${student.id}-${Date.now()}.${ext}`;
                              const presign = await fetch(`/api/storage/presign?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`).then((res) => res.json());
                              await fetch(presign.url, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
                              await fetch(`/api/master/students/${student.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ photoUrl: key }),
                              });
                              queryClient.invalidateQueries({ queryKey: ["students"] });
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="rounded border border-red-500 px-2 py-1 text-xs text-red-600"
                          onClick={() => remove.mutate(student.id)}
                          disabled={remove.isPending}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
