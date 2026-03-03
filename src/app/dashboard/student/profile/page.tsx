"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
import { User, Loader2 } from "lucide-react";

type CrmField = {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string | null;
  section: {
    id: string;
    title: string;
    order: number;
    width: number;
    tabId: string;
    tab: { id: string; label: string; order: number };
  } | null;
};

type TabGroup = {
  id: string;
  label: string;
  order: number;
  sections: {
    id: string;
    title: string;
    order: number;
    width: number;
    fields: CrmField[];
  }[];
};

function buildTabGroups(fields: CrmField[]): TabGroup[] {
  const byTab = new Map<
    string,
    { label: string; order: number; sections: Map<string, { title: string; order: number; width: number; fields: CrmField[] }> }
  >();
  for (const f of fields) {
    const sec = f.section;
    if (!sec) continue;
    let tab = byTab.get(sec.tabId);
    if (!tab) {
      tab = {
        label: sec.tab.label,
        order: sec.tab.order,
        sections: new Map(),
      };
      byTab.set(sec.tabId, tab);
    }
    let section = tab.sections.get(sec.id);
    if (!section) {
      section = { title: sec.title, order: sec.order, width: sec.width, fields: [] };
      tab.sections.set(sec.id, section);
    }
    section.fields.push(f);
  }
  const result: TabGroup[] = [];
  byTab.forEach((tab, tabId) => {
    const sections = Array.from(tab.sections.entries())
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => a.order - b.order);
    result.push({
      id: tabId,
      label: tab.label,
      order: tab.order,
      sections,
    });
  });
  result.sort((a, b) => a.order - b.order);
  return result;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{
    student: { id: string; stage: string } | null;
    crmData: Record<string, unknown>;
  } | null>(null);
  const [fields, setFields] = useState<CrmField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/student-profile", { cache: "no-store", credentials: "include" });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setProfile(data);
    const raw = (data.crmData ?? {}) as Record<string, unknown>;
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      next[k] = v != null ? String(v) : "";
    }
    setValues(next);
  }, [router]);

  useEffect(() => {
    async function load() {
      await loadProfile();
      const res = await fetch("/api/crm-fields", { cache: "no-store", credentials: "include" });
      if (res.ok) {
        const list = await res.json();
        setFields(list);
        const first = list.find((f: CrmField) => f.section?.tab?.id);
        if (first?.section?.tab?.id) setActiveTabId(first.section.tab.id);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!profile?.crmData || typeof profile.crmData !== "object") return;
    const raw = profile.crmData as Record<string, unknown>;
    setValues((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(raw)) {
        next[k] = v != null ? String(v) : "";
      }
      return next;
    });
  }, [profile?.crmData]);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/student-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: values }),
      credentials: "include",
    });
    setSaving(false);
    if (res.ok) await loadProfile();
  };

  const tabGroups = buildTabGroups(fields);
  const activeTab = activeTabId
    ? tabGroups.find((t) => t.id === activeTabId)
    : tabGroups[0];

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold leading-tight text-slate-900">Profilim</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hesap bilgileriniz ve başvuru formu.
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
              <p className="text-xs text-slate-500">
                {profile?.student
                  ? `Başvuru durumu: ${profile.student.stage ?? "—"}`
                  : "Öğrenci kaydınız bulunamadı."}
              </p>
            </div>
          </div>

          {tabGroups.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Henüz form alanı tanımlanmamış. Lütfen daha sonra tekrar deneyin.
            </p>
          ) : (
            <div className="mt-6">
              <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                {tabGroups.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      activeTabId === tab.id
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeTab && (
                <div className="flex flex-wrap gap-4">
                  {activeTab.sections.map((section) => (
                    <div
                      key={section.id}
                      style={{ width: `calc(${section.width}% - 8px)` }}
                      className="min-w-[200px] rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                    >
                      <h3 className="mb-3 text-sm font-semibold text-slate-800">
                        {section.title}
                      </h3>
                      <div className="space-y-3">
                        {section.fields.map((field) => (
                          <div key={field.id}>
                            <Label className="text-slate-700">
                              {field.label}
                              {field.required && (
                                <span className="ml-1 text-amber-600">*</span>
                              )}
                            </Label>
                            {field.type === "select" ? (
                              <Select
                                value={values[field.key] ?? ""}
                                onValueChange={(v) =>
                                  setValues((prev) => ({ ...prev, [field.key]: v }))
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(field.options ?? "")
                                    .split("\n")
                                    .map((o) => o.trim())
                                    .filter(Boolean)
                                    .map((opt) => (
                                      <SelectItem key={opt} value={opt}>
                                        {opt}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={
                                  field.type === "email"
                                    ? "email"
                                    : field.type === "number"
                                      ? "number"
                                      : field.type === "date"
                                        ? "date"
                                        : "text"
                                }
                                value={values[field.key] ?? ""}
                                onChange={(e) =>
                                  setValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className="mt-1"
                                required={field.required}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <Button onClick={save} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Kaydet
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-center text-xs text-slate-500">
        Yardım için{" "}
        <a
          href="mailto:support@campusgerman.com"
          className="text-primary hover:underline"
        >
          support@campusgerman.com
        </a>{" "}
        ile iletişime geçin.
      </p>
    </div>
  );
}
