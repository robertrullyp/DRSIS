"use client";

export default function StudentIdCardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Kartu Pelajar</h1>
      <p className="text-sm text-gray-600">Unduh kartu pelajar Anda dalam format PDF (ukuran kartu CR-80).</p>
      <div>
        <a
          href="/api/portal/student/id-card"
          target="_blank"
          rel="noreferrer"
          className="rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90"
        >
          Lihat / Unduh PDF
        </a>
      </div>
    </div>
  );
}

