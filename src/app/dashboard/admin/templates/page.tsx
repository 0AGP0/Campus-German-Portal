"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Loader2, Pencil, Trash2 } from "lucide-react";

type Template = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
};

export default function AdminTemplatesPage() {
  const [list, setList] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/templates", { credentials: "include" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Şablonlar yüklenemedi.");
      setList([]);
      return;
    }
    const data = await res.json();
    setList(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    load();
    setLoading(false);
  }, [load]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" şablonunu silmek istediğinize emin misiniz?`)) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) await load();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Belge Şablonları</h1>
          <p className="text-slate-600">
            HTML şablonları tanımlayın; placeholder’lar için veri kaynağı (CRM, öğrenci, tarih) eşlemesi yapın. Öğrenciler bu şablonlardan belge oluşturabilir.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/templates/new">
            <Plus className="mr-2 size-4" />
            Yeni şablon
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-amber-800">
          {error}
        </div>
      )}

      {list.length === 0 && !error && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <FileText className="mx-auto size-12 text-slate-300" />
          <p className="mt-4 font-medium text-slate-600">Henüz şablon yok</p>
          <p className="mt-1 text-sm text-slate-500">Yeni şablon ekleyerek başlayın.</p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/admin/templates/new">
              <Plus className="mr-2 size-4" />
              Yeni şablon
            </Link>
          </Button>
        </div>
      )}

      {list.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Ad</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Açıklama</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Durum</th>
                <th className="w-28 px-4 py-3 text-sm font-semibold text-slate-700">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-600">
                    {t.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        t.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/admin/templates/${t.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-red-600"
                        onClick={() => handleDelete(t.id, t.name)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
