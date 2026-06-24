"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortalStudentScopeBanner, usePortalStudentScope } from "@/components/portal/student-scope";

type CbtExam = {
  id: string;
  title: string;
  subject?: { name: string } | null;
  classroom?: { name: string } | null;
  startAt?: string | null;
  endAt?: string | null;
  questionCount: number;
  latestAttempt?: { score?: number | null; endedAt?: string | null } | null;
};

type CbtQuestion = {
  id: string;
  text: string;
  options?: string[] | null;
};

type ActiveAttempt = {
  exam: CbtExam;
  questions: CbtQuestion[];
  answers: Record<string, string>;
  score?: number | null;
};

export default function StudentCbtPage() {
  const { me, isLoading, selectedChildId, childScopedUrl, setSelectedChildId } = usePortalStudentScope();
  const [activeAttempt, setActiveAttempt] = useState<ActiveAttempt | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const { data, isFetching, refetch } = useQuery<{ items: CbtExam[] }>({
    queryKey: ["portal-cbt-exams", selectedChildId],
    enabled: Boolean(me?.student),
    queryFn: async () => {
      const res = await fetch(childScopedUrl("/api/portal/student/cbt/exams"));
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: CbtExam[] };
    },
  });

  const exams = data?.items ?? [];

  async function startExam(exam: CbtExam) {
    setSubmitting(true);
    try {
      const res = await fetch(childScopedUrl(`/api/portal/student/cbt/exams/${exam.id}/attempts`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      const payload = (await res.json()) as { questions?: CbtQuestion[] };
      setActiveAttempt({ exam, questions: payload.questions ?? [], answers: {}, score: null });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitExam() {
    if (!activeAttempt) return;
    setSubmitting(true);
    try {
      const res = await fetch(childScopedUrl(`/api/portal/student/cbt/exams/${activeAttempt.exam.id}/attempts`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: activeAttempt.answers }),
      });
      if (!res.ok) return;
      const payload = (await res.json()) as { grading?: { score?: number | null } };
      setActiveAttempt((current) => current ? { ...current, score: payload.grading?.score ?? null } : current);
      await refetch();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">CBT</h1>
      <PortalStudentScopeBanner me={me} isLoading={isLoading} onSelectChild={setSelectedChildId} />

      {activeAttempt ? (
        <section className="rounded-md border bg-card p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{activeAttempt.exam.title}</h2>
              <p className="text-sm text-muted-foreground">{activeAttempt.exam.subject?.name ?? "Umum"}</p>
            </div>
            {activeAttempt.score != null ? (
              <div className="rounded-md bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">
                Skor {activeAttempt.score.toFixed(1)}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            {activeAttempt.questions.map((question, index) => (
              <div key={question.id} className="rounded-md border p-3">
                <div className="mb-2 text-sm font-medium">{index + 1}. {question.text}</div>
                {question.options?.length ? (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={activeAttempt.answers[question.id] === option}
                          onChange={() =>
                            setActiveAttempt((current) =>
                              current
                                ? { ...current, answers: { ...current.answers, [question.id]: option } }
                                : current
                            )
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={activeAttempt.answers[question.id] ?? ""}
                    onChange={(event) =>
                      setActiveAttempt((current) =>
                        current
                          ? { ...current, answers: { ...current.answers, [question.id]: event.target.value } }
                          : current
                      )
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={isSubmitting || activeAttempt.score != null}
              onClick={submitExam}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => setActiveAttempt(null)}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Kembali
            </button>
          </div>
        </section>
      ) : isFetching ? (
        <div>Memuat...</div>
      ) : exams.length === 0 ? (
        <div className="text-sm text-muted-foreground">Tidak ada ujian aktif.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {exams.map((exam) => (
            <article key={exam.id} className="rounded-md border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{exam.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {[exam.subject?.name, exam.classroom?.name].filter(Boolean).join(" - ") || "Umum"}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs">{exam.questionCount} soal</span>
              </div>
              {exam.latestAttempt?.endedAt ? (
                <p className="mt-3 text-sm">Skor terakhir: {exam.latestAttempt.score?.toFixed(1) ?? "-"}</p>
              ) : null}
              <button
                type="button"
                disabled={isSubmitting || exam.questionCount === 0}
                onClick={() => startExam(exam)}
                className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
              >
                Mulai
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
