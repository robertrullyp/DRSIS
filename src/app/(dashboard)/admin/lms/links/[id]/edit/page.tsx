"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  DataTable,
  DataTableCell,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeaderCell,
  DataTablePagination,
  DataTableRow,
} from "@/components/ui/data-table";

type ClassroomSummary = { id: string; code: string; name: string } | null;
type SubjectSummary = { id: string; code: string; name: string } | null;

type LmsLinkItem = {
  id: string;
  external: string;
  externalId: string;
  classroomId: string | null;
  subjectId: string | null;
  classroom: ClassroomSummary;
  subject: SubjectSummary;
  scoreCount: number;
};

type Pageable<T> = { items: T[] };
type ClassroomOption = { id: string; code: string; name: string };
type SubjectOption = { id: string; code: string; name: string };

type ScoreItem = {
  id: string;
  studentId: string;
  score: number;
  syncedAt: string;
  student?: { id: string; nis: string | null; nisn: string | null; name: string | null; email: string };
};
type ScoreListResponse = { items: ScoreItem[]; total: number; page: number; pageSize: number };

type ImportResult = { imported: number; errors: Array<{ row: number; reason: string }> };

export default function AdminLmsEditLinkPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();

  const linkQuery = useQuery<LmsLinkItem>({
    queryKey: ["admin-lms-link", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/lms/links/${id}`);
      if (!res.ok) throw new Error("Failed to load link");
      return (await res.json()) as LmsLinkItem;
    },
    enabled: Boolean(id),
  });

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

  const [external, setExternal] = useState("");
  const [externalId, setExternalId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [scoresPage, setScoresPage] = useState(1);
  const [scoresPageSize, setScoresPageSize] = useState(25);

  const scoreQueryString = useMemo(() => {
    const p = new URLSearchParams({ page: String(scoresPage), pageSize: String(scoresPageSize) });
    return p.toString();
  }, [scoresPage, scoresPageSize]);

  const scoresQuery = useQuery<ScoreListResponse>({
    queryKey: ["admin-lms-scores", id, scoreQueryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/lms/links/${id}/scores?${scoreQueryString}`);
      if (!res.ok) throw new Error("Failed to load scores");
      return (await res.json()) as ScoreListResponse;
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    const link = linkQuery.data;
    if (!link) return;
    setExternal(link.external);
    setExternalId(link.externalId);
    setClassroomId(link.classroomId ?? "");
    setSubjectId(link.subjectId ?? "");
  }, [linkQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/lms/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          external,
          externalId,
          classroomId: classroomId || null,
          subjectId: subjectId || null,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(typeof payload?.error === "string" ? payload.error : "Update failed");
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-lms-link", id] });
      await qc.invalidateQueries({ queryKey: ["admin-lms-links"] });
    },
  });

  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");
  const [importMode, setImportMode] = useState<"replace_all" | "upsert">("replace_all");
  const [importText, setImportText] = useState("nisn,score\n1234567890123,85\n");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: async () => {
      setImportError(null);
      setImportResult(null);

      const body: Record<string, unknown> = { mode: importMode };
      if (importFormat === "csv") {
        body.csv = importText;
      } else {
        let parsed: unknown;
        try {
          parsed = JSON.parse(importText);
        } catch {
          throw new Error("JSON tidak valid");
        }
        if (!Array.isArray(parsed)) throw new Error("JSON harus berupa array (items)");
        body.items = parsed;
      }

      const res = await fetch(`/api/admin/lms/links/${id}/scores/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json().catch(() => null)) as ImportResult | { error?: unknown } | null;
      if (!res.ok) {
        throw new Error(typeof (payload as { error?: unknown } | null)?.error === "string" ? (payload as { error?: string }).error : "Gagal import skor");
      }
      return payload as ImportResult;
    },
    onSuccess: async (result) => {
      setImportResult(result);
      await qc.invalidateQueries({ queryKey: ["admin-lms-scores", id] });
      await qc.invalidateQueries({ queryKey: ["admin-lms-link", id] });
      await qc.invalidateQueries({ queryKey: ["admin-lms-links"] });
    },
    onError: (err) => setImportError(err instanceof Error ? err.message : "Gagal import"),
  });

  const link = linkQuery.data;
  const scoreRows = scoresQuery.data?.items ?? [];
  const scoreTotal = scoresQuery.data?.total ?? 0;
  const scorePage = scoresQuery.data?.page ?? scoresPage;
  const scorePageSize = scoresQuery.data?.pageSize ?? scoresPageSize;
  const hasPrev = scorePage > 1;
  const hasNext = scorePage * scorePageSize < scoreTotal;

  if (linkQuery.isLoading) return <div>Memuat...</div>;
  if (!link) return <div>Link tidak ditemukan.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Edit LMS/CBT Link</h1>
          <p className="text-sm text-muted-foreground">
            Skor saat ini: <span className="font-medium text-foreground">{link.scoreCount}</span>
          </p>
        </div>
        <button type="button" className="rounded-md border px-3 py-2 text-sm hover:bg-muted/70" onClick={() => router.push("/admin/lms/links")}>
          Kembali
        </button>
      </div>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Detail Link</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">External</label>
            <input className="w-full rounded-md border px-3 py-2" value={external} onChange={(e) => setExternal(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">External ID</label>
            <input className="w-full rounded-md border px-3 py-2" value={externalId} onChange={(e) => setExternalId(e.target.value)} />
          </div>
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
        {saveError ? <div className="text-sm text-red-600">{saveError}</div> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
            disabled={updateMutation.isPending}
            onClick={async () => {
              setSaveError(null);
              try {
                await updateMutation.mutateAsync();
              } catch (err) {
                setSaveError(err instanceof Error ? err.message : "Gagal menyimpan");
              }
            }}
          >
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Import Skor</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Format</label>
            <select className="w-full rounded-md border px-3 py-2" value={importFormat} onChange={(e) => setImportFormat(e.target.value as typeof importFormat)}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Mode</label>
            <select className="w-full rounded-md border px-3 py-2" value={importMode} onChange={(e) => setImportMode(e.target.value as typeof importMode)}>
              <option value="replace_all">Replace all (hapus skor lama)</option>
              <option value="upsert">Upsert (hapus+isi untuk student yang diimport)</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs text-muted-foreground">Kolom yang didukung</label>
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              studentId / nisn / nis / email, score
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            {importFormat === "csv" ? "CSV" : "JSON (array items)"}
          </label>
          <textarea
            className="w-full rounded-md border px-3 py-2 font-mono text-xs"
            rows={10}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={
              importFormat === "csv"
                ? "nisn,score\n1234567890123,80\n..."
                : '[{"nisn":"1234567890123","score":80},{"studentId":"...","score":90}]'
            }
          />
        </div>

        {importError ? <div className="text-sm text-red-600">{importError}</div> : null}
        {importResult ? (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p>
              Imported: <span className="font-medium">{importResult.imported}</span> | Errors:{" "}
              <span className="font-medium">{importResult.errors.length}</span>
            </p>
            {importResult.errors.length ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground">Lihat detail error</summary>
                <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                  {importResult.errors.slice(0, 50).map((err, idx) => (
                    <li key={idx}>
                      Row {err.row}: {err.reason}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          disabled={importMutation.isPending}
          onClick={() => importMutation.mutate()}
        >
          {importMutation.isPending ? "Mengimpor..." : "Import"}
        </button>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Skor Terimpor</h2>
          <span className="text-xs text-muted-foreground">Total: {scoreTotal}</span>
        </div>

        <DataTablePagination
          page={scorePage}
          pageSize={scorePageSize}
          total={scoreTotal}
          visibleCount={scoreRows.length}
          itemLabel="skor"
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPageChange={(nextPage) => setScoresPage(Math.max(1, nextPage))}
          onPageSizeChange={(nextSize) => {
            setScoresPageSize(nextSize);
            setScoresPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />

        <DataTable minWidthClassName="min-w-[1120px]">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>Student</DataTableHeaderCell>
              <DataTableHeaderCell>NIS</DataTableHeaderCell>
              <DataTableHeaderCell>NISN</DataTableHeaderCell>
              <DataTableHeaderCell>Email</DataTableHeaderCell>
              <DataTableHeaderCell>Score</DataTableHeaderCell>
              <DataTableHeaderCell>Synced</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <tbody>
            {scoreRows.length === 0 ? (
              <DataTableEmptyRow message={scoresQuery.isLoading ? "Memuat..." : "Belum ada skor."} colSpan={6} />
            ) : (
              scoreRows.map((row) => (
                <DataTableRow key={row.id}>
                  <DataTableCell className="font-medium">{row.student?.name || row.studentId}</DataTableCell>
                  <DataTableCell>{row.student?.nis ?? "-"}</DataTableCell>
                  <DataTableCell>{row.student?.nisn ?? "-"}</DataTableCell>
                  <DataTableCell>{row.student?.email ?? "-"}</DataTableCell>
                  <DataTableCell>{row.score}</DataTableCell>
                  <DataTableCell>{new Date(row.syncedAt).toLocaleString("id-ID")}</DataTableCell>
                </DataTableRow>
              ))
            )}
          </tbody>
        </DataTable>
      </section>
    </div>
  );
}
