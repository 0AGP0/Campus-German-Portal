"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

type StudentRow = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  stage: string;
  consultantId: string | null;
  consultantName: string;
  updatedAt: string;
};

type ConsultantOption = { id: string; name: string | null; email: string };

export default function AdminAssignmentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [consultants, setConsultants] = useState<ConsultantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localConsultant, setLocalConsultant] = useState<Record<string, string>>({});

  const NO_CONSULTANT = "__none__";

  async function fetchConsultants() {
    try {
      const res = await fetch("/api/users?limit=200");
      if (res.ok) {
        const data = await res.json();
        const items = data.items ?? data;
        setConsultants(Array.isArray(items) ? items.filter((u: { role: string }) => u.role === "CONSULTANT").map((u: { id: string; name: string | null; email: string }) => ({ id: u.id, name: u.name, email: u.email })) : []);
      }
    } catch {
      setConsultants([]);
    }
  }

  async function fetchStudents() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/students?${params}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      const items = data.items ?? data;
      const list = Array.isArray(items) ? items : [];
      setStudents(list);
      setTotal(typeof data.total === "number" ? data.total : list.length);
      setLocalConsultant((prev) => {
        const next = { ...prev };
        list.forEach((s: StudentRow) => {
          next[s.id] = s.consultantId ?? NO_CONSULTANT;
        });
        return next;
      });
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConsultants();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, search]);

  async function handleSaveConsultant(studentId: string) {
    const value = localConsultant[studentId] ?? NO_CONSULTANT;
    setSavingId(studentId);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultantId: value === NO_CONSULTANT ? null : value }),
      });
      if (res.ok) {
        await fetchStudents();
      }
    } finally {
      setSavingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Öğrenci atamaları
        </h1>
        <p className="mt-1 text-slate-500">
          Öğrencileri danışmanlara atayın veya atamayı değiştirin.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Öğrenci ara (ad / e-posta)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Yükleniyor…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="uppercase tracking-wider text-slate-500">Öğrenci</TableHead>
                <TableHead className="uppercase tracking-wider text-slate-500">E-posta</TableHead>
                <TableHead className="uppercase tracking-wider text-slate-500">Danışman</TableHead>
                <TableHead className="text-right uppercase tracking-wider text-slate-500">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                    Öğrenci bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900">{s.name}</TableCell>
                    <TableCell className="text-slate-600">{s.email}</TableCell>
                    <TableCell>
                      <Select
                        value={localConsultant[s.id] ?? NO_CONSULTANT}
                        onValueChange={(v) => setLocalConsultant((p) => ({ ...p, [s.id]: v }))}
                      >
                        <SelectTrigger className="w-[220px]">
                          <SelectValue placeholder="Danışman seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_CONSULTANT}>Atanmamış</SelectItem>
                          {consultants.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name ?? c.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={savingId === s.id}
                        onClick={() => handleSaveConsultant(s.id)}
                      >
                        {savingId === s.id ? "Kaydediliyor…" : "Kaydet"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/30 px-6 py-4">
            <span className="text-xs font-medium text-slate-500">
              Toplam {total} öğrenci
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-slate-600">
                Sayfa {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
