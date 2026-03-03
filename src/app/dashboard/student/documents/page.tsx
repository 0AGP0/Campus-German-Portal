"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Trash2, Loader2, FileOutput } from "lucide-react";
import { Label } from "@/components/ui/label";

type DocField = { id: string; label: string; description: string | null; required: boolean; order: number };
type DocTab = { id: string; label: string; order: number; fields: DocField[] };
type DocRow = { id: string; filename: string; docFieldId: string | null; createdAt: string; uploadedBy: string };
type TemplateOption = { id: string; name: string; description: string | null };

export default function StudentDocumentsPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [structure, setStructure] = useState<DocTab[]>([]);
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const profileRes = await fetch("/api/student-profile", { credentials: "include" });
      if (profileRes.status === 401 || profileRes.status === 403) {
        router.push("/login");
        return;
      }
      const profile = await profileRes.json();
      const sid = profile.student?.id;
      const uid = profile.student?.userId;
      if (!sid) {
        setStudentId(null);
        setStructure([]);
        setDocuments([]);
        setTemplates([]);
        setLoading(false);
        return;
      }
      setStudentId(sid);
      setCurrentUserId(uid ?? null);
      const [structRes, docsRes, templatesRes] = await Promise.all([
        fetch("/api/doc-structure", { credentials: "include" }),
        fetch(`/api/documents?studentId=${sid}`, { credentials: "include" }),
        fetch("/api/templates", { credentials: "include" }),
      ]);
      if (structRes.ok) setStructure(await structRes.json());
      else setStructure([]);
      if (docsRes.ok) {
        const docsJson = await docsRes.json();
        setDocuments(Array.isArray(docsJson) ? docsJson : []);
      } else setDocuments([]);
      if (templatesRes.ok) {
        const arr = await templatesRes.json();
        setTemplates(Array.isArray(arr) ? arr : []);
      } else setTemplates([]);
    } catch {
      setStudentId(null);
      setStructure([]);
      setDocuments([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, []);

  async function handleUpload(fieldId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !studentId) return;
    setUploading(fieldId);
    try {
      const form = new FormData();
      form.set("studentId", studentId);
      form.set("docFieldId", fieldId);
      form.set("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      if (res.ok) {
        await fetchData();
        router.refresh();
      }
      e.target.value = "";
    } finally {
      setUploading(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
        router.refresh();
      }
    } catch {}
  }

  async function handleGenerateDocument() {
    if (!selectedTemplateId || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedTemplateId }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Belge oluşturulamadı.");
        return;
      }
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html; charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      alert("Belge oluşturulurken bir hata oluştu.");
    } finally {
      setGenerating(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  }

  const docsByField = new Map<string, DocRow[]>();
  for (const d of documents) {
    const key = d.docFieldId ?? "__none__";
    if (!docsByField.has(key)) docsByField.set(key, []);
    docsByField.get(key)!.push(d);
  }
  const otherDocs = docsByField.get("__none__") ?? [];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Belgelerim</h1>
        <p className="text-slate-500">Öğrenci kaydınız bulunamadı. Lütfen yönetici ile iletişime geçin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Belgelerim</h1>
        <p className="mt-1 text-slate-500">Sekmelere göre belgelerinizi yükleyin veya görüntüleyin.</p>
      </div>

      {structure.length === 0 ? (
        <Card className="border-slate-200 p-8 text-center text-slate-500">
          Henüz belge alanı tanımlanmamış. Yönetici panelinden belge sekmeleri oluşturulduğunda burada listelenecektir.
        </Card>
      ) : (
        <div className="space-y-8">
          {structure.map((tab) => (
            <Card key={tab.id} className="overflow-hidden border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-3">
                <h2 className="text-lg font-bold text-slate-900">{tab.label}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {(tab.fields ?? []).map((field) => {
                  const fieldDocs = docsByField.get(field.id) ?? [];
                  const latest = fieldDocs[0];
                  const isMyDoc = latest && latest.uploadedBy === currentUserId;
                  return (
                    <div key={field.id} className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-slate-400" />
                          <span className="font-medium text-slate-800">{field.label}</span>
                          {field.required && <span className="text-xs text-amber-600">Zorunlu</span>}
                        </div>
                        {field.description && (
                          <p className="mt-1 text-sm text-slate-500">{field.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {latest ? (
                          <>
                            <a
                              href={`/api/documents/${latest.id}`}
                              download
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                              <Download className="size-4" />
                              {latest.filename}
                            </a>
                            <span className="text-xs text-slate-400">{formatDate(latest.createdAt)}</span>
                            {isMyDoc && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-red-500"
                                onClick={() => handleDelete(latest.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleUpload(field.id, e)}
                                disabled={!!uploading}
                              />
                              <span className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 px-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
                                {uploading === field.id ? <Loader2 className="size-4 animate-spin" /> : "Yenile"}
                              </span>
                            </label>
                          </>
                        ) : (
                          <label className="inline-flex cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleUpload(field.id, e)}
                              disabled={!!uploading}
                            />
                            <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                              {uploading === field.id ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                              Yükle
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {templates.length > 0 && (
        <Card className="border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-3">
            <h2 className="text-lg font-bold text-slate-900">Belge oluştur</h2>
            <p className="text-sm text-slate-500">
              Şablon seçip kendi bilgilerinizle belge üretebilirsiniz. Oluşturulan belge yeni sekmede açılır; yazdırıp PDF olarak kaydedebilirsiniz.
            </p>
          </div>
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="template-select">Şablon</Label>
              <select
                id="template-select"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                <option value="">— Şablon seçin —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.description ? ` — ${t.description}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleGenerateDocument}
              disabled={!selectedTemplateId || generating}
              className="shrink-0"
            >
              {generating ? <Loader2 className="size-4 animate-spin" /> : <FileOutput className="size-4" />}
              <span className="ml-2">{generating ? "Oluşturuluyor…" : "Oluştur"}</span>
            </Button>
          </div>
        </Card>
      )}

      {otherDocs.length > 0 && (
        <Card className="border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-3">
            <h2 className="text-lg font-bold text-slate-900">Diğer belgeler</h2>
            <p className="text-sm text-slate-500">Daha önce kategorisiz yüklenen belgeler.</p>
          </div>
          <ul className="divide-y divide-slate-100 p-6">
            {otherDocs.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <a href={`/api/documents/${d.id}`} download className="text-sm font-medium text-primary hover:underline">
                  {d.filename}
                </a>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500" onClick={() => handleDelete(d.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
