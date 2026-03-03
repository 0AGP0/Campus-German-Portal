"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, GraduationCap, Save, PanelTop } from "lucide-react";

type CrmField = {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  order?: number;
  options?: string | null;
  section?: {
    id: string;
    title: string;
    order: number;
    tabId: string;
    width?: number;
    tab: { id: string; label: string; order: number };
  } | null;
};

type TabGroup = { id: string; label: string; order: number; sections: { id: string; title: string; order: number; width: number; fields: CrmField[] }[] };

function groupFieldsByTabAndSection(fields: CrmField[]): { tabs: TabGroup[]; flat: CrmField[] } {
  const flat = fields.filter((f) => !f.section);
  const withSection = fields.filter((f) => f.section?.tab);
  const tabMap = new Map<string, TabGroup>();
  for (const f of withSection) {
    const tab = f.section!.tab;
    if (!tabMap.has(tab.id)) {
      tabMap.set(tab.id, { id: tab.id, label: tab.label, order: tab.order, sections: [] });
    }
    const t = tabMap.get(tab.id)!;
    const sec = f.section!;
    let sect = t.sections.find((s) => s.id === sec.id);
    if (!sect) {
      sect = { id: sec.id, title: sec.title, order: sec.order, width: sec.width ?? 100, fields: [] };
      t.sections.push(sect);
    }
    sect.fields.push(f);
  }
  for (const t of tabMap.values()) {
    t.sections.sort((a, b) => a.order - b.order);
    t.sections.forEach((s) => s.fields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }
  const tabs = Array.from(tabMap.values()).sort((a, b) => a.order - b.order);
  return { tabs, flat };
}

export default function StudentProfilePage() {
  const router = useRouter();
  const [fields, setFields] = useState<CrmField[]>([]);
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const { tabs, flat } = useMemo(() => groupFieldsByTabAndSection(fields), [fields]);

  async function fetchProfile() {
    try {
      const [fieldsRes, profileRes] = await Promise.all([
        fetch("/api/crm-fields"),
        fetch("/api/student-profile"),
      ]);
      if (fieldsRes.status === 401 || profileRes.status === 401) {
        router.push("/login");
        return;
      }
      const fieldsData = await fieldsRes.json();
      const profileData = await profileRes.json();
      setFields(Array.isArray(fieldsData) ? fieldsData : []);
      setData(typeof profileData.crmData === "object" && profileData.crmData !== null ? profileData.crmData : {});
    } catch {
      setFields([]);
      setData({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (tabs.length > 0 && !activeTabId) setActiveTabId(tabs[0].id);
  }, [tabs, activeTabId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/student-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Kaydedildi." });
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: err.error ?? "Kayıt başarısız." });
      }
    } catch {
      setMessage({ type: "error", text: "Bağlantı hatası." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl p-8 text-center text-slate-500">Yükleniyor…</div>;
  }

  function renderField(f: CrmField) {
    return (
      <div key={f.id} className="flex flex-col gap-2">
        <Label htmlFor={f.key} className="text-sm font-semibold text-slate-900">
          {f.label}
          {f.required && <span className="text-destructive"> *</span>}
        </Label>
        {f.type === "select" ? (
          <select
            id={f.key}
            required={f.required}
            value={data[f.key] ?? ""}
            onChange={(e) => setData((p) => ({ ...p, [f.key]: e.target.value }))}
            className="flex h-12 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900"
          >
            <option value="">Seçin</option>
            {(f.options || "").split(/[,\n]/).map((o) => o.trim()).filter(Boolean).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <Input
            id={f.key}
            type={f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "date" ? "date" : "text"}
            required={f.required}
            placeholder={f.label}
            value={data[f.key] ?? ""}
            onChange={(e) => setData((p) => ({ ...p, [f.key]: e.target.value }))}
            className="h-12 border-slate-200 bg-white focus:border-primary focus:ring-primary"
          />
        )}
      </div>
    );
  }

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const hasTabs = tabs.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold leading-tight text-slate-900">Profilim</h1>
        <p className="mt-1 text-sm text-slate-500">
          CRM için kişisel bilgilerinizi ve program detaylarınızı güncelleyin.
        </p>
      </div>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-6 border-b border-slate-100 pb-6">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-10" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Profil</p>
              <p className="text-xs text-slate-500">Bilgilerinizi aşağıdan güncelleyebilirsiniz.</p>
            </div>
          </div>

          {hasTabs && (
            <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    activeTabId === tab.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <PanelTop className="size-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
            {hasTabs && activeTab ? (
              <div className="space-y-8">
                {activeTab.sections.map((sec) => (
                  <div key={sec.id} className="rounded-lg border border-slate-100 bg-slate-50/30 p-4">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">{sec.title}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {sec.fields.map((f) => (
                        <div key={f.id}>{renderField(f)}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {flat.length > 0 && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {flat.map((f) => (
                      <div key={f.id}>{renderField(f)}</div>
                    ))}
                  </div>
                )}
                {flat.length === 0 && tabs.length === 0 && (
                  <p className="text-slate-500">Henüz doldurulacak CRM alanı tanımlanmamış.</p>
                )}
              </>
            )}

            {message && (
              <p className={message.type === "success" ? "text-green-600" : "text-destructive"}>{message.text}</p>
            )}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button type="submit" className="flex-1 gap-2" disabled={saving}>
                <Save className="size-5" />
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </Button>
              <Button type="button" variant="outline" className="flex-1 border-slate-200" onClick={() => setMessage(null)}>
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-slate-500">
        Yardım için{" "}
        <a href="mailto:support@campusgerman.com" className="text-primary hover:underline">
          support@campusgerman.com
        </a>{" "}
        ile iletişime geçin.
      </p>
    </div>
  );
}
