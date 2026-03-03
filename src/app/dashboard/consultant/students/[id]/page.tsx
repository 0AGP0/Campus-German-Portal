"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileText, User } from "lucide-react";

const stageOptions = [
  { value: "BASVURU", label: "Başvuru" },
  { value: "BELGELER_TAMAM", label: "Belgeler tamam" },
  { value: "ODEME_BEKLIYOR", label: "Ödeme bekliyor" },
  { value: "KAYIT_TAMAM", label: "Kayıt tamam" },
];

type DocRow = { id: string; filename: string; docFieldId: string | null; createdAt: string; uploadedBy: string };

type CrmField = {
  id: string;
  key: string;
  label: string;
  type: string;
  section: {
    id: string;
    title: string;
    order: number;
    width: number;
    tabId: string;
    tab: { id: string; label: string; order: number };
  } | null;
};

type StudentDetail = {
  id: string;
  stage: string;
  user: { id: string; email: string; name: string | null } | null;
  documents: DocRow[];
  crmData?: Record<string, unknown>;
};

function buildTabGroups(fields: CrmField[]): { id: string; label: string; sections: { id: string; title: string; width: number; fields: CrmField[] }[] }[] {
  const byTab = new Map<string, { label: string; order: number; sections: Map<string, { title: string; order: number; width: number; fields: CrmField[] }> }>();
  for (const f of fields) {
    const sec = f.section;
    if (!sec) continue;
    let tab = byTab.get(sec.tabId);
    if (!tab) {
      tab = { label: sec.tab.label, order: sec.tab.order, sections: new Map() };
      byTab.set(sec.tabId, tab);
    }
    let section = tab.sections.get(sec.id);
    if (!section) {
      section = { title: sec.title, order: sec.order, width: sec.width, fields: [] };
      tab.sections.set(sec.id, section);
    }
    section.fields.push(f);
  }
  return Array.from(byTab.entries())
    .map(([tabId, tab]) => ({
      id: tabId,
      label: tab.label,
      order: tab.order,
      sections: Array.from(tab.sections.entries())
        .map(([id, s]) => ({ id, ...s }))
        .sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => a.order - b.order);
}

export default function ConsultantStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [crmFields, setCrmFields] = useState<CrmField[]>([]);
  const [docStructure, setDocStructure] = useState<{ id: string; label: string; order: number; fields: { id: string; label: string; description: string | null; required: boolean }[] }[]>([]);

  async function fetchStudent() {
    if (!id) return;
    try {
      const res = await fetch(`/api/students/${id}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setStudent(null);
        return;
      }
      const data = await res.json();
      setStudent(data);
      setStage(data.stage ?? "BASVURU");
    } catch {
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (!student) return;
    fetch("/api/crm-fields", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setCrmFields)
      .catch(() => setCrmFields([]));
    fetch("/api/doc-structure", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setDocStructure)
      .catch(() => setDocStructure([]));
  }, [student?.id]);

  async function handleStageChange(newStage: string) {
    setStage(newStage);
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStudent(updated);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(fieldId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingFieldId(fieldId);
    try {
      const form = new FormData();
      form.set("studentId", id);
      form.set("docFieldId", fieldId);
      form.set("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      if (res.ok) {
        const data = await fetch(`/api/students/${id}`);
        const studentData = await data.json();
        setStudent(studentData);
        router.refresh();
      }
      e.target.value = "";
    } finally {
      setUploadingFieldId(null);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Yükleniyor…</div>;
  }
  if (!student) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/consultant/students" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="size-4" />
          Öğrenci listesine dön
        </Link>
        <p className="text-slate-500">Öğrenci bulunamadı.</p>
      </div>
    );
  }

  const name = student.user?.name ?? "—";
  const email = student.user?.email ?? "—";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/consultant/students" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="size-4" />
            Listeye dön
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{name}</h1>
            <p className="text-slate-500">E-posta: {email}</p>
          </div>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-200 bg-slate-50/50">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Aşama</Label>
          <Select value={stage} onValueChange={handleStageChange} disabled={saving}>
            <SelectTrigger className="mt-2 max-w-xs h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stageOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {saving && <p className="mt-1 text-xs text-slate-500">Kaydediliyor…</p>}
        </CardHeader>
      </Card>

      {crmFields.length > 0 && (
        <Card className="overflow-hidden border-slate-200">
          <CardHeader className="border-b border-slate-200 bg-slate-50/50">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <User className="size-5 text-primary" />
              CRM Bilgileri
            </h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              {buildTabGroups(crmFields).map((tab) => (
                <div key={tab.id} className="w-full space-y-4">
                  <h3 className="text-sm font-semibold text-slate-600">{tab.label}</h3>
                  <div className="flex flex-wrap gap-4">
                    {tab.sections.map((section) => (
                      <div
                        key={section.id}
                        style={{ width: `calc(${section.width}% - 8px)` }}
                        className="min-w-[200px] rounded-lg border border-slate-200 bg-slate-50/30 p-4"
                      >
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {section.title}
                        </h4>
                        <dl className="space-y-2">
                          {section.fields.map((field) => {
                            const val = student.crmData?.[field.key];
                            const display = val != null && String(val).trim() !== "" ? String(val) : "—";
                            return (
                              <div key={field.id}>
                                <dt className="text-xs text-slate-500">{field.label}</dt>
                                <dd className="text-sm font-medium text-slate-800">{display}</dd>
                              </div>
                            );
                          })}
                        </dl>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="border-b border-slate-200 bg-slate-50/50">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FileText className="size-5 text-primary" />
            Belgeler
          </h2>
        </CardHeader>
        <CardContent className="p-6">
          {docStructure.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz belge alanı tanımlanmamış. Admin panelinden Belge Alanları ile sekme ve alan ekleyin.</p>
          ) : (
            <div className="space-y-6">
              {docStructure.map((tab) => (
                <div key={tab.id}>
                  <h3 className="mb-3 text-sm font-semibold text-slate-600">{tab.label}</h3>
                  <ul className="space-y-3">
                    {(tab.fields ?? []).map((field) => {
                      const doc = (student.documents ?? []).find((d) => d.docFieldId === field.id);
                      return (
                        <li key={field.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <span className="font-medium text-slate-800">{field.label}</span>
                            {field.required && <span className="ml-1 text-xs text-amber-600">Zorunlu</span>}
                            {field.description && <p className="mt-1 text-sm text-slate-500">{field.description}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            {doc ? (
                              <>
                                <a href={`/api/documents/${doc.id}`} download className="text-sm font-medium text-primary hover:underline">
                                  {doc.filename}
                                </a>
                                <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                                <label className="cursor-pointer">
                                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(field.id, e)} disabled={!!uploadingFieldId} />
                                  <span className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 px-3 text-sm hover:bg-slate-50 disabled:opacity-50">
                                    {uploadingFieldId === field.id ? "Yükleniyor…" : "Yenile"}
                                  </span>
                                </label>
                              </>
                            ) : (
                              <label className="inline-flex cursor-pointer">
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(field.id, e)} disabled={!!uploadingFieldId} />
                                <span className="inline-flex h-9 items-center justify-center rounded-md bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50">
                                  {uploadingFieldId === field.id ? "Yükleniyor…" : "Belge yükle"}
                                </span>
                              </label>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
