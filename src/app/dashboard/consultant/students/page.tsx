"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, ArrowRight, Search, ChevronLeft, ChevronRight } from "lucide-react";

const stageLabels: Record<string, string> = {
  BASVURU: "Başvuru",
  BELGELER_TAMAM: "Belgeler tamam",
  ODEME_BEKLIYOR: "Ödeme bekliyor",
  KAYIT_TAMAM: "Kayıt tamam",
};

const stageColors: Record<string, string> = {
  BASVURU: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  BELGELER_TAMAM: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  ODEME_BEKLIYOR: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  KAYIT_TAMAM: "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
};

type StudentRow = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  stage: string;
  updatedAt: string;
};

export default function ConsultantStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addForm, setAddForm] = useState({ email: "", password: "", name: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stageFilter, setStageFilter] = useState("");
  const limit = 15;

  async function fetchStudents() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) params.set("q", search.trim());
      if (stageFilter) params.set("stage", stageFilter);
      const res = await fetch(`/api/students?${params}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      const items = data.items ?? data;
      setStudents(Array.isArray(items) ? items : []);
      setTotal(data.total ?? 0);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, [page, search, stageFilter]);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      const res = await fetch("/api/consultant/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addForm.email.trim(),
          password: addForm.password,
          name: addForm.name.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data.error ?? "Kayıt başarısız.");
        setAddLoading(false);
        return;
      }
      setAddDialogOpen(false);
      setAddForm({ email: "", password: "", name: "" });
      fetchStudents();
      router.refresh();
    } catch {
      setAddError("Bağlantı hatası.");
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900">
            Öğrenciler
          </h1>
          <p className="text-base text-slate-500">
            Öğrencilerinizin kayıt sürecini yönetin ve takip edin.
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="size-5" />
              Yeni öğrenci ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni öğrenci</DialogTitle>
              <DialogDescription>
                Öğrenci hesabı oluşturulur ve size atanır. E-posta ve şifre ile giriş yapabilir.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">E-posta</Label>
                <Input id="new-email" type="email" required value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} placeholder="ogrenci@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Şifre</Label>
                <Input id="new-password" type="password" required minLength={6} value={addForm.password} onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))} placeholder="En az 6 karakter" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-name">Ad (isteğe bağlı)</Label>
                <Input id="new-name" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ad Soyad" />
              </div>
              {addError && <p className="text-sm text-destructive">{addError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>İptal</Button>
                <Button type="submit" disabled={addLoading}>{addLoading ? "Ekleniyor…" : "Ekle"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="overflow-hidden border-slate-200">
        <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Öğrenci adı veya e-posta ile ara..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex h-12 w-full border border-slate-200 bg-slate-50 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={stageFilter}
              onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
              className="h-12 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
            >
              <option value="">Tüm aşamalar</option>
              {Object.entries(stageLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Yükleniyor…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50/50">
                <TableHead className="w-1/4 uppercase tracking-wider text-slate-600">Öğrenci adı</TableHead>
                <TableHead className="w-1/4 uppercase tracking-wider text-slate-600">E-posta</TableHead>
                <TableHead className="w-1/5 text-center uppercase tracking-wider text-slate-600">Aşama</TableHead>
                <TableHead className="w-1/6 uppercase tracking-wider text-slate-600">Son güncelleme</TableHead>
                <TableHead className="w-1/10 text-right uppercase tracking-wider text-slate-600">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                    Size atanmış öğrenci yok.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s) => (
                  <TableRow key={s.id} className="transition-colors hover:bg-slate-50/50">
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500">{s.email}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex justify-center">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${stageColors[s.stage] ?? "bg-slate-100 text-slate-600"}`}>
                          {stageLabels[s.stage] ?? s.stage}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-500">{formatDate(s.updatedAt)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Link href={`/dashboard/consultant/students/${s.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                        Detay
                        <ArrowRight className="size-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        {!loading && students.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
            <p className="text-sm text-slate-500">Toplam {total} öğrenci</p>
            {total > limit && (
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
                <span className="text-sm text-slate-600">Sayfa {page} / {Math.max(1, Math.ceil(total / limit))}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9"
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
