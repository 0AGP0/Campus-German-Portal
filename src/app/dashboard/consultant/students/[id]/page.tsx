"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, User, FileText, Pencil } from "lucide-react";

const stageOptions = [
  { value: "BASVURU", label: "Başvuru" },
  { value: "BELGELER_TAMAM", label: "Belgeler tamam" },
  { value: "ODEME_BEKLIYOR", label: "Ödeme bekliyor" },
  { value: "KAYIT_TAMAM", label: "Kayıt tamam" },
];

type CrmFieldDef = { id: string; key: string; label: string; type: string; required: boolean; options: string | null };

type DocRow = { id: string; filename: string; createdAt: string; uploadedBy: string };

type StudentDetail = {
  id: string;
  stage: string;
  user: { id: string; email: string; name: string | null } | null;
  crmData: { data: string } | null;
  documents: DocRow[];
};

export default function ConsultantStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [crmFields, setCrmFields] = useState<CrmFieldDef[]>([]);
  const [crmEditMode, setCrmEditMode] = useState(false);
  const [crmFormData, setCrmFormData] = useState<Record<string, string>>({});
  const [crmSaving, setCrmSaving] = useState(false);

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

  async function fetchCrmFields() {
    try {
      const res = await fetch("/api/crm-fields");
      if (!res.ok) return;
      const data = await res.json();
      setCrmFields(Array.isArray(data) ? data : []);
    } catch {
      setCrmFields([]);
    }
  }

  function openCrmEdit() {
    const crmData = student?.crmData?.data ? JSON.parse(student.crmData.data) : {};
    setCrmFormData(typeof crmData === "object" && crmData !== null ? crmData : {});
    setCrmEditMode(true);
    fetchCrmFields();
  }

  async function saveCrmData(e: React.FormEvent) {
    e.preventDefault();
    setCrmSaving(true);
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: crmFormData }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStudent(updated);
        setCrmEditMode(false);
        router.refresh();
      }
    } finally {
      setCrmSaving(false);
    }
  }

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("studentId", id);
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
      setUploading(false);
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

  const crmData = student.crmData?.data ? JSON.parse(student.crmData.data) : {};
  const name = student.user?.name ?? "—";
  const email = student.user?.email ?? "—";

  const renderCrmValue = (key: string) => {
    const val = crmEditMode ? crmFormData[key] : crmData[key];
    return val ?? "—";
  };

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

      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 bg-slate-50/50">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <User className="size-5 text-primary" />
            CRM Bilgileri
          </h2>
          {!crmEditMode ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={openCrmEdit}>
              <Pencil className="size-4" />
              Düzenle
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setCrmEditMode(false)}>İptal</Button>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {crmEditMode ? (
            <form onSubmit={saveCrmData} className="space-y-4">
              {crmFields.length === 0 && <p className="text-sm text-slate-500">CRM alanları yükleniyor…</p>}
              <div className="grid gap-4 md:grid-cols-2">
                {crmFields.map((f) => (
                  <div key={f.id} className="space-y-2">
                    <Label htmlFor={`crm-${f.key}`}>{f.label}{f.required ? " *" : ""}</Label>
                    {f.type === "select" ? (
                      <select
                        id={`crm-${f.key}`}
                        value={crmFormData[f.key] ?? ""}
                        onChange={(e) => setCrmFormData((p) => ({ ...p, [f.key]: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Seçin</option>
                        {(f.options || "").split(/[,\n]/).map((opt) => opt.trim()).filter(Boolean).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={`crm-${f.key}`}
                        type={f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "date" ? "date" : "text"}
                        value={crmFormData[f.key] ?? ""}
                        onChange={(e) => setCrmFormData((p) => ({ ...p, [f.key]: e.target.value }))}
                        required={f.required}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={crmSaving}>{crmSaving ? "Kaydediliyor…" : "Kaydet"}</Button>
                <Button type="button" variant="outline" onClick={() => setCrmEditMode(false)}>İptal</Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {crmFields.length > 0
                ? crmFields.map((f) => (
                    <div key={f.id}>
                      <p className="text-xs font-semibold uppercase text-slate-500">{f.label}</p>
                      <p className="border-b border-slate-100 pb-2 font-medium text-slate-900">{renderCrmValue(f.key)}</p>
                    </div>
                  ))
                : (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Ad Soyad</p>
                      <p className="border-b border-slate-100 pb-2 font-medium text-slate-900">{crmData.fullName ?? name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Telefon</p>
                      <p className="border-b border-slate-100 pb-2 font-medium text-slate-900">{crmData.phone ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">E-posta</p>
                      <p className="border-b border-slate-100 pb-2 font-medium text-slate-900">{email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Program</p>
                      <p className="border-b border-slate-100 pb-2 font-medium text-slate-900">{crmData.program ?? "—"}</p>
                    </div>
                  </>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 bg-slate-50/50">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FileText className="size-5 text-primary" />
            Belgeler
          </h2>
          <label className="inline-flex cursor-pointer">
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            <span className="inline-flex h-9 items-center justify-center rounded-md bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50">
              {uploading ? "Yükleniyor…" : "Belge yükle"}
            </span>
          </label>
        </CardHeader>
        <CardContent className="p-6">
          {!student.documents || student.documents.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz belge yok. Yüklemek için &quot;Belge yükle&quot; kullanın.</p>
          ) : (
            <ul className="space-y-2">
              {student.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-lg border border-slate-100 py-2 px-3">
                  <span className="text-sm font-medium text-slate-700">{d.filename}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{formatDate(d.createdAt)}</span>
                    <a href={`/api/documents/${d.id}`} download className="text-sm font-bold text-primary hover:underline">
                      İndir
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
