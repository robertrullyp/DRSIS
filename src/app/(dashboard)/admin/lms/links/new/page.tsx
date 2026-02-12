"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type ClassroomOption = { id: string; code: string; name: string };
type SubjectOption = { id: string; code: string; name: string };

type Pageable<T> = { items: T[] };

export default function AdminLmsNewLinkPage() {
  const router = useRouter();
  const [external, setExternal] = useState("");
  const [externalId, setExternalId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classroomsQuery = useQuery<Pageable<ClassroomOption>>({
    queryKey: ["master-classrooms", "simple"],
    queryFn: async () => {
      const res = await fetch("/api/master/classrooms?page=1&pageSize=200");
      if (!res.ok) throw new Error("Failed to load classrooms");
      return (await res.json()) as Pageable<ClassroomOption>;
    },
  });

  const subjectsQuery = useQuery<Pageable<SubjectOption>>({
    queryKey: ["master-subjects", "simple"],
    queryFn: async () => {
      const res = await fetch("/api/master/subjects?page=1&pageSize=200");
      if (!res.ok) throw new Error("Failed to load subjects");
      return (await res.json()) as Pageable<SubjectOption>;
    },
  });

  const classrooms = useMemo(() => classroomsQuery.data?.items ?? [], [classroomsQuery.data?.items]);
  const subjects = useMemo(() => subjectsQuery.data?.items ?? [], [subjectsQuery.data?.items]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/lms/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        external,
        externalId,
        classroomId: classroomId || undefined,
        subjectId: subjectId || undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
      setError(typeof payload?.error === "string" ? payload.error : "Gagal membuat link");
      return;
    }

    router.push("/admin/lms/links");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Buat LMS/CBT Link</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">External</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={external}
            onChange={(e) => setExternal(e.target.value)}
            placeholder="contoh: moodle / google-classroom / cbtext"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">External ID</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            placeholder="id ujian/assignment dari sistem eksternal"
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Kelas (opsional)</label>
            <select className="w-full rounded-md border px-3 py-2" value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
              <option value="">(none)</option>
              {classrooms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Mapel (opsional)</label>
            <select className="w-full rounded-md border px-3 py-2" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">(none)</option>
              {subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
          <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => router.push("/admin/lms/links")}>
            Batal
          </button>
        </div>

        <div className="rounded-lg border p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Catatan</p>
          <ul className="mt-1 list-disc pl-5">
            <li>Link ini dipakai untuk mengelompokkan skor impor per ujian/assessment eksternal.</li>
            <li>Kelas/Mapel bersifat opsional, tapi disarankan untuk mempermudah audit.</li>
          </ul>
        </div>
      </form>
    </div>
  );
}

