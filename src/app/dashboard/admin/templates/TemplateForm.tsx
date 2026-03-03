"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";

const STATIC_SOURCES: { value: string; label: string }[] = [
  { value: "user.name", label: "Kullanıcı adı" },
  { value: "user.email", label: "Kullanıcı e-posta" },
  { value: "student.stage", label: "Öğrenci aşaması" },
  { value: "date", label: "Bugünün tarihi" },
  { value: "year", label: "Yıl" },
];

function parsePlaceholders(content: string): string[] {
  const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) set.add(m[1]);
  return Array.from(set).sort();
}

type CrmField = { id: string; key: string; label: string };

type TemplateFormProps = {
  id: string | null;
  initial: {
    name: string;
    description: string | null;
    content: string | null;
    mapping: string | null;
    active: boolean;
  } | null;
};

export function TemplateForm({ id, initial }: TemplateFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    if (!initial?.mapping) return {};
    try {
      return (JSON.parse(initial.mapping) as Record<string, string>) ?? {};
    } catch {
      return {};
    }
  });
  const [crmFields, setCrmFields] = useState<CrmField[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholders = useMemo(() => parsePlaceholders(content), [content]);
  const sourceOptions = useMemo(() => {
    const list = [...STATIC_SOURCES];
    crmFields.forEach((f) => list.push({ value: `crm.${f.key}`, label: `CRM: ${f.label}` }));
    return list;
  }, [crmFields]);

  useEffect(() => {
    if (id) {
      fetch(`/api/templates/${id}`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((t) => {
          if (t) {
            setName(t.name ?? "");
            setDescription(t.description ?? "");
            setContent(t.content ?? "");
            setActive(t.active ?? true);
            try {
              setMapping(t.mapping ? (JSON.parse(t.mapping) as Record<string, string>) : {});
            } catch {
              setMapping({});
            }
          } else setError("Şablon yüklenemedi.");
        })
        .catch(() => setError("Şablon yüklenemedi."))
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    fetch("/api/crm-fields", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setCrmFields(Array.isArray(arr) ? arr : []))
      .catch(() => setCrmFields([]));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!name.trim()) {
        setError("Şablon adı gerekli.");
        return;
      }
      setSaving(true);
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        content: content.trim() || null,
        mapping: JSON.stringify(mapping),
        active,
      };
      const url = id ? `/api/templates/${id}` : "/api/templates";
      const method = id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      setSaving(false);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Kayıt başarısız.");
        return;
      }
      if (!id) {
        const t = await res.json();
        router.replace(`/dashboard/admin/templates/${t.id}`);
      }
    },
    [id, name, description, content, mapping, active, router]
  );

  const handleDelete = useCallback(async () => {
    if (!id || !confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) router.replace("/dashboard/admin/templates");
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/templates">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">
          {id ? "Şablonu düzenle" : "Yeni şablon"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Şablon adı</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Kabul mektubu"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama (isteğe bağlı)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Öğrenciye görünen kısa açıklama"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <Label htmlFor="active">Aktif (öğrenciler görebilir)</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">HTML içerik</Label>
          <p className="text-xs text-slate-500">
            Placeholder’lar <code className="rounded bg-slate-100 px-1">{`{{placeholder_adi}}`}</code> formatında yazın. Aşağıda her biri için veri kaynağı seçin.
          </p>
          <textarea
            id="content"
            rows={14}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={'<h1>Kabul Mektubu</h1>\n<p>Sayın {{ad_soyad}},</p>\n<p>Tarih: {{tarih}}</p>'}
          />
        </div>

        {placeholders.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Placeholder eşlemesi</h3>
            <p className="mb-4 text-xs text-slate-500">
              Her placeholder için veri kaynağı seçin (CRM alanları, kullanıcı bilgisi, tarih vb.).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {placeholders.map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <Label className="shrink-0 font-mono text-slate-600">{`{{${key}}}`}</Label>
                  <select
                    className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={mapping[key] ?? ""}
                    onChange={(e) => setMapping((prev) => ({ ...prev, [key]: e.target.value }))}
                  >
                    <option value="">— Kaynak seçin —</option>
                    {sourceOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span className="ml-2">{saving ? "Kaydediliyor…" : "Kaydet"}</span>
          </Button>
          {id && (
            <Button type="button" variant="outline" className="text-red-600 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 className="size-4" />
              <span className="ml-2">Şablonu sil</span>
            </Button>
          )}
          <Button type="button" variant="ghost" asChild>
            <Link href="/dashboard/admin/templates">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
