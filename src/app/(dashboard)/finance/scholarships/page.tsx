"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Student = { id: string; user: { name?: string | null } };
type Scholarship = {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  endDate?: string | null;
  student: Student;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ScholarshipsPage() {
  const qc = useQueryClient();
  const { data: students } = useQuery<{ items: Student[] }>({
    queryKey: ["students"],
    queryFn: async () =>
      (await (await fetch("/api/master/students")).json()) as { items: Student[] },
  });
  const { data, isLoading } = useQuery<{ items: Scholarship[] }>({
    queryKey: ["finance-scholarships"],
    queryFn: async () =>
      (await (await fetch("/api/finance/scholarships?pageSize=200")).json()) as {
        items: Scholarship[];
      },
  });

  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!studentId && students?.items?.length) {
      setStudentId(students.items[0].id);
    }
  }, [students, studentId]);

  const canSubmit = useMemo(
    () => Boolean(studentId && name && amount && startDate),
    [studentId, name, amount, startDate]
  );

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/finance/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          name,
          amount: Number(amount),
          startDate,
          endDate: endDate || undefined,
        }),
      });
      if (!res.ok) throw new Error("Create scholarship failed");
    },
    onSuccess: () => {
      setName("");
      setAmount("");
      setStartDate("");
      setEndDate("");
      qc.invalidateQueries({ queryKey: ["finance-scholarships"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/scholarships/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete scholarship failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-scholarships"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Keuangan: Beasiswa</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          create.mutate();
        }}
        className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 md:grid-cols-6 md:items-end"
      >
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Siswa</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          >
            {students?.items?.map((student) => (
              <option key={student.id} value={student.id}>
                {student.user?.name ?? student.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Nama</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Jumlah</label>
          <Input
            type="number"
            min={0}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Mulai</label>
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Selesai (opsional)
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={create.isPending || !canSubmit}>
          Tambah
        </Button>
      </form>

      {isLoading ? (
        <div>Memuat...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b p-2 text-left">Siswa</th>
                <th className="border-b p-2 text-left">Nama</th>
                <th className="border-b p-2 text-left">Jumlah</th>
                <th className="border-b p-2 text-left">Mulai</th>
                <th className="border-b p-2 text-left">Selesai</th>
                <th className="border-b p-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="border-b p-2">{row.student.user?.name ?? "-"}</td>
                  <td className="border-b p-2">{row.name}</td>
                  <td className="border-b p-2">{formatMoney(row.amount)}</td>
                  <td className="border-b p-2">
                    {new Date(row.startDate).toLocaleDateString()}
                  </td>
                  <td className="border-b p-2">
                    {row.endDate ? new Date(row.endDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="border-b p-2">
                    <Button
                      variant="outline"
                      onClick={() => remove.mutate(row.id)}
                      disabled={remove.isPending}
                    >
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))}
              {(data?.items?.length ?? 0) === 0 ? (
                <tr>
                  <td className="p-2 text-muted-foreground" colSpan={6}>
                    Belum ada data beasiswa.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
