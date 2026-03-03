"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, MoreVertical, Edit, UserX, Search, ChevronLeft, ChevronRight } from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  CONSULTANT: "Danışman",
  STUDENT: "Öğrenci",
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "STUDENT" as "ADMIN" | "CONSULTANT" | "STUDENT", consultantId: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; role: "ADMIN" | "CONSULTANT" | "STUDENT"; consultantId: string } | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [consultants, setConsultants] = useState<UserRow[]>([]);

  async function fetchConsultants() {
    try {
      const res = await fetch("/api/users?limit=200");
      if (!res.ok) return;
      const data = await res.json();
      const items = data.items ?? data;
      const list = Array.isArray(items) ? items : [];
      setConsultants(list.filter((u: UserRow) => u.role === "CONSULTANT"));
    } catch {
      setConsultants([]);
    }
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/users?${params}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConsultants();
  }, []);
  useEffect(() => {
    fetchConsultants();
  }, []);
  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim() || undefined,
          role: form.role,
          ...(form.role === "STUDENT" && form.consultantId && { consultantId: form.consultantId }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Kayıt başarısız.");
        setSubmitLoading(false);
        return;
      }
      setDialogOpen(false);
      setForm({ email: "", password: "", name: "", role: "STUDENT", consultantId: "" });
      fetchUsers();
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitLoading(false);
    }
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("tr-TR", { month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  }

  async function openEdit(u: UserRow) {
    setEditId(u.id);
    setEditError("");
    try {
      const res = await fetch(`/api/users/${u.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setEditForm({
        name: data.name ?? "",
        role: data.role ?? "STUDENT",
        consultantId: data.consultantId ?? "",
      });
    } catch {
      setEditId(null);
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editForm) return;
    setEditError("");
    setEditLoading(true);
    try {
      const res = await fetch(`/api/users/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim() || null,
          role: editForm.role,
          ...(editForm.role === "STUDENT" && { consultantId: editForm.consultantId || null }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(data.error ?? "Güncelleme başarısız.");
        setEditLoading(false);
        return;
      }
      setEditId(null);
      setEditForm(null);
      fetchUsers();
      router.refresh();
    } catch {
      setEditError("Bağlantı hatası.");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Kullanıcılar</h1>
          <p className="mt-1 text-slate-500">Organizasyon üyelerini yönetin, filtreleyin ve rol atayın.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <UserPlus className="size-5" />
              Yeni kullanıcı
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni kullanıcı</DialogTitle>
              <DialogDescription>
                E-posta, şifre ve rol belirleyin. Kayıt sonrası giriş yapabilir.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="ornek@campusgerman.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="En az 6 karakter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Ad (isteğe bağlı)</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((p) => ({ ...p, role: v as "ADMIN" | "CONSULTANT" | "STUDENT" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="CONSULTANT">Danışman</SelectItem>
                    <SelectItem value="STUDENT">Öğrenci</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.role === "STUDENT" && (
                <div className="space-y-2">
                  <Label>Danışman (isteğe bağlı)</Label>
                  <Select
                    value={form.consultantId || "__none__"}
                    onValueChange={(v) => setForm((p) => ({ ...p, consultantId: v === "__none__" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Atanmasın" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Atanmasın</SelectItem>
                      {consultants.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name ?? u.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading ? "Kaydediliyor…" : "Kaydet"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Ad veya e-posta ile ara"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4">
          <span className="text-xs font-medium text-slate-400">
            Toplam {total} kullanıcı
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Yükleniyor…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="uppercase tracking-wider text-slate-500">Ad</TableHead>
                <TableHead className="uppercase tracking-wider text-slate-500">E-posta</TableHead>
                <TableHead className="uppercase tracking-wider text-slate-500">Rol</TableHead>
                <TableHead className="text-right uppercase tracking-wider text-slate-500">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                    Henüz kullanıcı yok. &quot;Yeni kullanıcı&quot; ile ekleyin.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="transition-colors hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{u.name ?? "—"}</p>
                          <p className="text-xs text-slate-500">Katılım {formatDate(u.createdAt)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{u.email}</TableCell>
                    <TableCell>
                      <Badge className="border-primary/20 bg-primary/10 text-primary">
                        {roleLabels[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-9 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600">
                            <MoreVertical className="size-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="gap-3" onClick={() => openEdit(u)}>
                            <Edit className="size-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 text-red-600" disabled>
                            <UserX className="size-4" />
                            Devre dışı bırak (yakında)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Düzenle modal */}
      <Dialog open={!!editId} onOpenChange={(open) => !open && (setEditId(null), setEditForm(null))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcıyı düzenle</DialogTitle>
            <DialogDescription>Ad, rol ve (öğrenciyse) danışman atamasını güncelleyebilirsiniz.</DialogDescription>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Ad</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => p ? { ...p, name: e.target.value } : p)}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm((p) => p ? { ...p, role: v as "ADMIN" | "CONSULTANT" | "STUDENT" } : p)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="CONSULTANT">Danışman</SelectItem>
                    <SelectItem value="STUDENT">Öğrenci</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editForm.role === "STUDENT" && (
                <div className="space-y-2">
                  <Label>Danışman (isteğe bağlı)</Label>
                  <Select
                    value={(editForm.consultantId ?? "") || "__none__"}
                    onValueChange={(v) => setEditForm((p) => (p ? { ...p, consultantId: v === "__none__" ? "" : v } : p))}
                  >
                    <SelectTrigger><SelectValue placeholder="Atanmasın" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Atanmasın</SelectItem>
                      {consultants.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name ?? u.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => (setEditId(null), setEditForm(null))}>İptal</Button>
                <Button type="submit" disabled={editLoading}>{editLoading ? "Kaydediliyor…" : "Kaydet"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {!loading && total > limit && (
        <div className="flex items-center justify-end gap-2">
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
            Sayfa {page} / {Math.max(1, Math.ceil(total / limit))}
          </span>
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
  );
}
