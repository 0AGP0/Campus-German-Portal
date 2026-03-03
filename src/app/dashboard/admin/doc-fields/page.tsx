"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, FileText } from "lucide-react";

type DocField = {
  id: string;
  tabId: string;
  label: string;
  description: string | null;
  required: boolean;
  order: number;
};

type DocTab = {
  id: string;
  label: string;
  order: number;
  fields: DocField[];
};

export default function AdminDocFieldsPage() {
  const [tabs, setTabs] = useState<DocTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [addFieldMode, setAddFieldMode] = useState(false);
  const [tabLabel, setTabLabel] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldDescription, setFieldDescription] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setApiError(null);
    const res = await fetch("/api/doc-tabs", { credentials: "include" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setApiError(body?.error ?? "Belge alanları yüklenemedi.");
      setTabs([]);
      return;
    }
    const data = await res.json();
    setTabs(Array.isArray(data) ? data : []);
    if (!activeTabId && Array.isArray(data) && data.length) setActiveTabId(data[0].id);
  }, [activeTabId]);

  useEffect(() => {
    load();
    setLoading(false);
  }, []);

  useEffect(() => {
    const tab = tabs.find((t) => t.id === selectedTabId);
    if (tab) setTabLabel(tab.label);
    const field = tabs.flatMap((t) => t.fields ?? []).find((f) => f.id === selectedFieldId);
    if (field) {
      setFieldLabel(field.label);
      setFieldDescription(field.description ?? "");
      setFieldRequired(field.required);
    }
  }, [tabs, selectedTabId, selectedFieldId]);

  const saveTab = async () => {
    if (!selectedTabId || !tabLabel.trim()) return;
    setSaving(true);
    await fetch(`/api/doc-tabs/${selectedTabId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: tabLabel.trim() }),
      credentials: "include",
    });
    setSaving(false);
    await load();
  };

  const deleteTab = async (id: string) => {
    if (!confirm("Bu sekmeyi ve içindeki belge alanlarını silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/doc-tabs/${id}`, { method: "DELETE", credentials: "include" });
    if (activeTabId === id) setActiveTabId(tabs.find((t) => t.id !== id)?.id ?? null);
    if (selectedTabId === id) setSelectedTabId(null);
    setSelectedFieldId(null);
    await load();
  };

  const addTab = async () => {
    setSaving(true);
    const res = await fetch("/api/doc-tabs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "Yeni sekme", order: tabs.length }),
      credentials: "include",
    });
    setSaving(false);
    if (!res.ok) return;
    const tab = await res.json();
    await load();
    setActiveTabId(tab.id);
    setSelectedTabId(tab.id);
    setSelectedFieldId(null);
    setTabLabel(tab.label);
  };

  const saveField = async () => {
    setSaving(true);
    if (addFieldMode && activeTabId) {
      await fetch("/api/doc-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabId: activeTabId,
          label: fieldLabel.trim(),
          description: fieldDescription.trim() || undefined,
          required: fieldRequired,
        }),
        credentials: "include",
      });
      setAddFieldMode(false);
      setFieldLabel("");
      setFieldDescription("");
      setFieldRequired(false);
    } else if (selectedFieldId) {
      await fetch(`/api/doc-fields/${selectedFieldId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: fieldLabel.trim(),
          description: fieldDescription.trim() || null,
          required: fieldRequired,
        }),
        credentials: "include",
      });
    }
    setSaving(false);
    await load();
  };

  const deleteField = async (id: string) => {
    if (!confirm("Bu belge alanını silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/doc-fields/${id}`, { method: "DELETE", credentials: "include" });
    if (selectedFieldId === id) setSelectedFieldId(null);
    await load();
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const fields = activeTab?.fields ?? [];
  const selectedTab = tabs.find((t) => t.id === selectedTabId);
  const selectedField = tabs.flatMap((t) => t.fields ?? []).find((f) => f.id === selectedFieldId);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Belge Alanları</h1>
          <p className="text-slate-600">Öğrenci ve danışmanların yükleyeceği belge türlerini sekmelere göre tanımlayın.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-6">
          <p className="font-medium text-amber-800">Kurulum gerekli</p>
          <p className="mt-2 text-sm text-amber-700">{apiError}</p>
          <p className="mt-3 text-sm text-slate-600">
            Terminalde (dev sunucusu kapalıyken): <code className="rounded bg-slate-200 px-1">npx prisma generate</code> ve <code className="rounded bg-slate-200 px-1">npx prisma db push</code> çalıştırın, ardından sunucuyu yeniden başlatın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Belge Alanları</h1>
        <p className="text-slate-600">
          Sekmelere göre öğrenci ve danışmanların yükleyeceği belge türlerini tanımlayın. Sekme veya alan seçip sağdaki panelden düzenleyin.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sol / Orta: Canvas (CRM gibi) */}
        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTabId(tab.id);
                  setSelectedTabId(tab.id);
                  setSelectedFieldId(null);
                  setAddFieldMode(false);
                  setTabLabel(tab.label);
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  setSelectedTabId(tab.id);
                  setTabLabel(tab.label);
                }}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                  activeTabId === tab.id
                    ? "border-primary bg-primary text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addTab} disabled={saving}>
              <Plus className="mr-1 size-4" />
              Sekme
            </Button>
          </div>

          {activeTabId && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">{activeTab?.label} — Belge alanları</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddFieldMode(true);
                    setSelectedFieldId(null);
                    setSelectedTabId(null);
                    setFieldLabel("");
                    setFieldDescription("");
                    setFieldRequired(false);
                  }}
                >
                  <Plus className="mr-1 size-4" />
                  Alan ekle
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                {fields.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm text-slate-500">
                    Bu sekmede henüz belge alanı yok. &quot;Alan ekle&quot; ile ekleyin veya sağ panelden yeni alan oluşturun.
                  </div>
                ) : (
                  fields.map((f) => (
                    <div
                      key={f.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedFieldId(f.id);
                        setSelectedTabId(null);
                        setAddFieldMode(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedFieldId(f.id);
                          setSelectedTabId(null);
                          setAddFieldMode(false);
                        }
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border-2 bg-white px-4 py-3 transition-shadow ${
                        selectedFieldId === f.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <FileText className="size-4 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <span className="font-medium text-slate-800">{f.label}</span>
                          {f.required && <span className="ml-2 text-xs text-amber-600">Zorunlu</span>}
                          {f.description && (
                            <p className="mt-0.5 truncate text-sm text-slate-500">{f.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-slate-400 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteField(f.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Sağ: Özellikler paneli (CRM gibi) */}
        <div className="w-80 shrink-0 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Özellikler</h3>
            {selectedTab && !selectedField && !addFieldMode && (
              <div className="space-y-3">
                <div>
                  <Label>Sekme adı</Label>
                  <Input
                    value={tabLabel}
                    onChange={(e) => setTabLabel(e.target.value)}
                    onBlur={() => tabLabel.trim() && saveTab()}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => deleteTab(selectedTab.id)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Sekmeyi sil
                </Button>
                <p className="text-xs text-slate-500">Değişiklikler kaydedilir.</p>
              </div>
            )}
            {(addFieldMode || selectedField) && (
              <div className="space-y-3">
                <div>
                  <Label>Etiket</Label>
                  <Input
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    placeholder="Örn. Pasaport kopyası"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Açıklama (isteğe bağlı)</Label>
                  <Input
                    value={fieldDescription}
                    onChange={(e) => setFieldDescription(e.target.value)}
                    placeholder="Öğrenciye gösterilecek kısa açıklama"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fieldRequired"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                  />
                  <Label htmlFor="fieldRequired">Zorunlu</Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveField}
                    disabled={saving || !fieldLabel.trim()}
                  >
                    {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                    {addFieldMode ? "Ekle" : "Kaydet"}
                  </Button>
                  {addFieldMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAddFieldMode(false);
                        setFieldLabel("");
                        setFieldDescription("");
                        setFieldRequired(false);
                      }}
                    >
                      İptal
                    </Button>
                  )}
                  {selectedField && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => deleteField(selectedField.id)}
                    >
                      Sil
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-500">Değişiklikler kaydedilir.</p>
              </div>
            )}
            {!selectedTab && !selectedField && !addFieldMode && (
              <p className="text-sm text-slate-500">
                Düzenlemek için bir sekme seçin veya bir alan tıklayın. Yeni alan için &quot;Alan ekle&quot; kullanın.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
