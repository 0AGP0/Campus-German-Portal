"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaletteFieldItem, type PaletteFieldType } from "@/components/crm/PaletteFieldItem";
import { SectionDropZone } from "@/components/crm/SectionDropZone";
import { SortableSectionItem } from "@/components/crm/SortableSectionItem";
import { SortableFieldItem } from "@/components/crm/SortableFieldItem";
import { Plus, Eye, Loader2, Trash2 } from "lucide-react";

type CrmField = {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  options: string | null;
  sectionId: string | null;
  hidden: boolean;
};

type CrmSection = {
  id: string;
  tabId: string;
  title: string;
  order: number;
  width: number;
  fields: CrmField[];
};

type CrmTab = {
  id: string;
  label: string;
  order: number;
  sections: CrmSection[];
};

type HiddenField = {
  id: string;
  key: string;
  label: string;
  type: string;
  section: { id: string; title: string; tab: { id: string; label: string } } | null;
};

type BuilderData = {
  tabs: CrmTab[];
  orphanFields: CrmField[];
  hiddenFields: HiddenField[];
};

function makeKey(type: PaletteFieldType): string {
  const base = type === "email" ? "email" : type === "number" ? "number" : type === "date" ? "birth_date" : type === "select" ? "choice" : "text";
  return `${base}_${Date.now().toString(36)}`;
}

export default function CrmFieldsPage() {
  const [data, setData] = useState<BuilderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionWidth, setSectionWidth] = useState(100);
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState("");
  const [deleteFieldModal, setDeleteFieldModal] = useState<{
    fieldId: string;
    fieldLabel: string;
    students: { id: string; name: string | null; email: string }[];
  } | null>(null);
  const [unhiding, setUnhiding] = useState<string | null>(null);
  const [activePaletteType, setActivePaletteType] = useState<PaletteFieldType | null>(null);
  const saveSectionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFieldRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTabRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (): Promise<BuilderData | null> => {
    const res = await fetch("/api/crm-builder", { cache: "no-store", credentials: "include" });
    if (!res.ok) return null;
    const json = await res.json();
    setData(json);
    if (!activeTabId && json.tabs?.length) {
      setActiveTabId(json.tabs[0].id);
    }
    return json;
  }, [activeTabId]);

  useEffect(() => {
    load();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!data) return;
    const tabs = data.tabs ?? [];
    const tab = tabs.find((t) => t.id === selectedTabId);
    if (tab) {
      setSectionTitle("");
      setSectionWidth(100);
    }
    const section = tabs.flatMap((t) => t.sections ?? []).find((s) => s.id === selectedSectionId);
    if (section) {
      setSectionTitle(section.title);
      setSectionWidth(section.width);
    }
    const field = tabs
      .flatMap((t) => t.sections ?? [])
      .flatMap((s) => s.fields ?? [])
      .find((f) => f.id === selectedFieldId);
    if (field) {
      setFieldLabel(field.label);
      setFieldRequired(field.required);
      setFieldOptions(field.options ?? "");
    }
  }, [data, selectedTabId, selectedSectionId, selectedFieldId]);

  const addTab = async () => {
    const res = await fetch("/api/crm-tabs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "Yeni sekme", order: (data?.tabs?.length ?? 0) }),
      credentials: "include",
    });
    if (!res.ok) return;
    const tab = await res.json();
    setData((prev) => (prev ? { ...prev, tabs: [...(prev.tabs ?? []), tab] } : null));
    setActiveTabId(tab.id);
    setSelectedTabId(tab.id);
    setSelectedSectionId(null);
    setSelectedFieldId(null);
  };

  const updateTab = async (id: string, label: string) => {
    await fetch(`/api/crm-tabs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
      credentials: "include",
    });
    setData((prev) => {
      if (!prev) return prev;
      const tabs = prev.tabs ?? [];
      return {
        ...prev,
        tabs: tabs.map((t) => (t.id === id ? { ...t, label } : t)),
      };
    });
  };

  const addSection = async () => {
    if (!activeTabId) return;
    const res = await fetch("/api/crm-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tabId: activeTabId,
        title: "Yeni bölüm",
        order: data?.tabs?.find((t) => t.id === activeTabId)?.sections?.length ?? 0,
        width: 100,
      }),
      credentials: "include",
    });
    if (!res.ok) return;
    const section = await res.json();
    setData((prev) => {
      if (!prev) return prev;
      const tabs = prev.tabs ?? [];
      return {
        ...prev,
        tabs: tabs.map((t) =>
          t.id === activeTabId
            ? { ...t, sections: [...(t.sections ?? []), { ...section, fields: [] }] }
            : t
        ),
      };
    });
    setSelectedSectionId(section.id);
    setSelectedFieldId(null);
    setSelectedTabId(null);
  };

  const saveSection = useCallback(
    async (id: string, title: string, width: number) => {
      await fetch(`/api/crm-sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, width }),
        credentials: "include",
      });
      setData((prev) => {
        if (!prev) return prev;
        const tabs = prev.tabs ?? [];
        return {
          ...prev,
          tabs: tabs.map((t) => ({
            ...t,
            sections: (t.sections ?? []).map((s) =>
              s.id === id ? { ...s, title, width } : s
            ),
          })),
        };
      });
    },
    []
  );

  const onSectionTitleChange = (id: string, title: string) => {
    setSectionTitle(title);
    if (saveSectionRef.current) clearTimeout(saveSectionRef.current);
    saveSectionRef.current = setTimeout(() => {
      saveSection(id, title, sectionWidth);
    }, 400);
  };

  const onSectionWidthChange = (id: string, width: number) => {
    setSectionWidth(width);
    saveSection(id, sectionTitle || "Bölüm", width);
  };

  const createFieldInSection = async (sectionId: string, fieldType: PaletteFieldType) => {
    const key = makeKey(fieldType);
    const labels: Record<PaletteFieldType, string> = {
      text: "Metin",
      email: "E-posta",
      number: "Sayı",
      date: "Tarih",
      select: "Seçenek",
    };
    const section = (data?.tabs ?? []).flatMap((t) => t.sections ?? []).find((s) => s.id === sectionId);
    const order = section?.fields?.length ?? 0;
    const res = await fetch("/api/crm-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        label: labels[fieldType],
        type: fieldType,
        required: false,
        order,
        sectionId,
      }),
      credentials: "include",
    });
    if (!res.ok) return;
    const field = await res.json();
    await load();
    setSelectedFieldId(field.id);
    setSelectedSectionId(sectionId);
    setSelectedTabId(null);
  };

  const saveField = useCallback(
    async (
      id: string,
      updates: { label?: string; required?: boolean; options?: string | null }
    ) => {
      await fetch(`/api/crm-fields/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      await load();
    },
    []
  );

  const onFieldLabelChange = (id: string, label: string) => {
    setFieldLabel(label);
    if (saveFieldRef.current) clearTimeout(saveFieldRef.current);
    saveFieldRef.current = setTimeout(() => saveField(id, { label }), 400);
  };

  const onFieldRequiredChange = (id: string, required: boolean) => {
    setFieldRequired(required);
    saveField(id, { required });
  };

  const onFieldOptionsChange = (id: string, options: string) => {
    setFieldOptions(options);
    if (saveFieldRef.current) clearTimeout(saveFieldRef.current);
    saveFieldRef.current = setTimeout(
      () => saveField(id, { options: options.trim() || null }),
      400
    );
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Bu bölümü silmek istediğinize emin misiniz? Alanlar sekmesiz kalır."))
      return;
    await fetch(`/api/crm-sections/${id}`, { method: "DELETE", credentials: "include" });
    await load();
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
      setSectionTitle("");
      setSectionWidth(100);
    }
  };

  const deleteTab = async (id: string) => {
    if (!confirm("Bu sekmeyi silmek istediğinize emin misiniz? İçindeki bölüm ve alanlar da silinir."))
      return;
    await fetch(`/api/crm-tabs/${id}`, { method: "DELETE", credentials: "include" });
    const nextData = await load();
    if (selectedTabId === id) setSelectedTabId(null);
    if (activeTabId === id) {
      setActiveTabId(nextData?.tabs?.[0]?.id ?? null);
    }
  };

  const checkDeleteField = async (id: string, label: string) => {
    const res = await fetch(`/api/crm-fields/${id}/students-with-data`, {
      credentials: "include",
    });
    const json = await res.json();
    setDeleteFieldModal({
      fieldId: id,
      fieldLabel: label,
      students: json.students ?? [],
    });
  };

  const hideOrDeleteField = async (fieldId: string, hide: boolean) => {
    if (hide) {
      await fetch(`/api/crm-fields/${fieldId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: true }),
        credentials: "include",
      });
    } else {
      await fetch(`/api/crm-fields/${fieldId}`, {
        method: "DELETE",
        credentials: "include",
      });
    }
    setDeleteFieldModal(null);
    await load();
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
      setFieldLabel("");
      setFieldRequired(false);
      setFieldOptions("");
    }
  };

  const unhideField = async (id: string) => {
    setUnhiding(id);
    await fetch(`/api/crm-fields/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: false }),
      credentials: "include",
    });
    await load();
    setUnhiding(null);
  };

  const moveFieldToSection = async (fieldId: string, sectionId: string) => {
    await fetch(`/api/crm-fields/${fieldId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId }),
      credentials: "include",
    });
    await load();
    setSelectedFieldId(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e: DragStartEvent) => {
    if (e.active.data.current?.type === "palette") {
      setActivePaletteType(e.active.data.current.fieldType as PaletteFieldType);
    }
  };

  const resolveSectionIdFromOver = useCallback(
    (overId: string, overData: { type?: string; sectionId?: string } | null): string | null => {
      if (overData?.type === "section" && overData.sectionId) return overData.sectionId;
      if (overData?.type === "field") {
        const tabs = data?.tabs ?? [];
        for (const tab of tabs) {
          for (const sec of tab.sections ?? []) {
            if ((sec.fields ?? []).some((f) => f.id === overId)) return sec.id;
          }
        }
      }
      return null;
    },
    [data?.tabs]
  );

  const handleDragEnd = async (e: DragEndEvent) => {
    setActivePaletteType(null);
    const { active, over } = e;
    if (!over) return;

    if (active.data.current?.type === "palette") {
      const sectionId = resolveSectionIdFromOver(
        String(over.id),
        over.data.current as { type?: string; sectionId?: string } | null
      );
      if (sectionId) {
        const fieldType = active.data.current.fieldType as PaletteFieldType;
        await createFieldInSection(sectionId, fieldType);
      }
      return;
    }

    if (active.data.current?.type === "section" && over.data.current?.type === "section") {
      const activeId = active.id as string;
      const overId = over.id as string;
      if (activeId === overId || !activeTabId || !data) return;
      const tabs = data.tabs ?? [];
      const tab = tabs.find((t) => t.id === activeTabId);
      if (!tab?.sections) return;
      const oldIndex = tab.sections.findIndex((s) => s.id === activeId);
      const newIndex = tab.sections.findIndex((s) => s.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(tab.sections, oldIndex, newIndex);
      for (let i = 0; i < reordered.length; i++) {
        await fetch(`/api/crm-sections/${reordered[i].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: i }),
          credentials: "include",
        });
      }
      await load();
      return;
    }

    if (active.data.current?.type === "field" && over.data.current?.type === "field") {
      const activeId = active.id as string;
      const overId = over.id as string;
      if (activeId === overId || !data) return;
      let section: CrmSection | null = null;
      const tabs = data.tabs ?? [];
      for (const t of tabs) {
        const secs = t.sections ?? [];
        const s = secs.find((sec) => (sec.fields ?? []).some((f) => f.id === activeId));
        if (s) {
          section = s;
          break;
        }
      }
      if (!section?.fields) return;
      const oldIndex = section.fields.findIndex((f) => f.id === activeId);
      const newIndex = section.fields.findIndex((f) => f.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(section.fields, oldIndex, newIndex);
      for (let i = 0; i < reordered.length; i++) {
        await fetch(`/api/crm-fields/${reordered[i].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: i }),
          credentials: "include",
        });
      }
      await load();
    }
  };

  const activeTab = (data?.tabs ?? []).find((t) => t.id === activeTabId);
  const sections = activeTab?.sections ?? [];
  const selectedSection = (data?.tabs ?? [])
    .flatMap((t) => t.sections ?? [])
    .find((s) => s.id === selectedSectionId);
  const selectedFieldInSection = (data?.tabs ?? [])
    .flatMap((t) => t.sections ?? [])
    .flatMap((s) => s.fields ?? [])
    .find((f) => f.id === selectedFieldId);
  const selectedOrphanField = (data?.orphanFields ?? []).find((f) => f.id === selectedFieldId) ?? null;
  const selectedField = selectedFieldInSection ?? selectedOrphanField ?? null;
  const selectedTab = (data?.tabs ?? []).find((t) => t.id === selectedTabId);

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CRM Alanları</h1>
        <p className="text-slate-600">
          Sekmeler ve konteynerlar ile form alanlarını düzenleyin. Alanları sağdaki paletten sürükleyip bırakın.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6">
          {/* Sol: Sekmeler + Canvas */}
          <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {(data.tabs ?? []).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTabId(tab.id);
                    setSelectedSectionId(null);
                    setSelectedFieldId(null);
                    setSelectedTabId(null);
                  }}
                  onDoubleClick={() => setSelectedTabId(tab.id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    activeTabId === tab.id
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addTab}>
                <Plus className="mr-1 size-4" />
                Sekme
              </Button>
            </div>

            {activeTabId && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {activeTab?.label} — Bölümler
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={addSection}>
                    <Plus className="mr-1 size-4" />
                    Bölüm ekle
                  </Button>
                </div>
                <SortableContext
                  items={sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-wrap gap-4">
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        style={{ width: `calc(${section.width}% - 8px)` }}
                        className="min-w-[240px]"
                      >
                        <SortableSectionItem
                          id={section.id}
                          title={section.title}
                          width={section.width}
                          selected={selectedSectionId === section.id}
                          onSelect={() => {
                            setSelectedSectionId(section.id);
                            setSelectedFieldId(null);
                            setSelectedTabId(null);
                          }}
                          onDelete={() => deleteSection(section.id)}
                        >
                          <SectionDropZone
                            id={section.id}
                            isEmpty={!(section.fields?.length > 0)}
                          >
                            <SortableContext
                              items={(section.fields ?? []).map((f) => f.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="flex flex-col gap-2">
                                {(section.fields ?? []).map((f) => (
                                  <SortableFieldItem
                                    key={f.id}
                                    id={f.id}
                                    fieldKey={f.key}
                                    label={f.label}
                                    type={f.type}
                                    required={f.required}
                                    selected={selectedFieldId === f.id}
                                    onSelect={() => {
                                      setSelectedFieldId(f.id);
                                      setSelectedSectionId(section.id);
                                      setSelectedTabId(null);
                                    }}
                                    onDelete={() => checkDeleteField(f.id, f.label)}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </SectionDropZone>
                        </SortableSectionItem>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </>
            )}

            {(data.orphanFields?.length ?? 0) > 0 && (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-600">
                  Bölümsüz alanlar ({data.orphanFields.length})
                </h3>
                <p className="mb-3 text-xs text-slate-500">
                  Bu alanlar bir bölüme atanmamış (örn. bölüm silindi). Seçip &quot;Bölüme taşı&quot; ile atayın veya silin.
                </p>
                <ul className="space-y-2">
                  {data.orphanFields.map((f) => (
                    <li
                      key={f.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedFieldId(f.id);
                        setSelectedSectionId(null);
                        setSelectedTabId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedFieldId(f.id);
                          setSelectedSectionId(null);
                          setSelectedTabId(null);
                        }
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        selectedFieldId === f.id
                          ? "border-primary bg-primary/10"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="font-medium text-slate-700">{f.label}</span>
                      <span className="text-xs text-slate-400">{f.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sağ: Palet + Özellikler */}
          <div className="w-80 shrink-0 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Alan ekle</h3>
              <p className="mb-3 text-xs text-slate-500">
                Bir alanı sol taraftaki bölüme sürükleyip bırakın.
              </p>
              <div className="flex flex-col gap-2">
                {(["text", "email", "number", "date", "select"] as const).map((type) => (
                  <PaletteFieldItem key={type} type={type} id={`palette-${type}`} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Özellikler</h3>
              {selectedTab && (
                <div className="space-y-3">
                  <div>
                    <Label>Sekme adı</Label>
                    <Input
                      value={selectedTab.label}
                      onChange={(e) => {
                        const v = e.target.value;
                        setData((prev) => {
                          if (!prev) return prev;
                          const tabs = prev.tabs ?? [];
                          return {
                            ...prev,
                            tabs: tabs.map((t) =>
                              t.id === selectedTab.id ? { ...t, label: v } : t
                            ),
                          };
                        });
                        if (saveTabRef.current) clearTimeout(saveTabRef.current);
                        saveTabRef.current = setTimeout(
                          () => updateTab(selectedTab.id, v),
                          400
                        );
                      }}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => deleteTab(selectedTab.id)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Sekmeyi sil
                  </Button>
                  <p className="text-xs text-slate-500">Değişiklikler otomatik kaydedilir.</p>
                </div>
              )}
              {selectedSection && !selectedField && (
                <div className="space-y-3">
                  <div>
                    <Label>Bölüm başlığı</Label>
                    <Input
                      value={sectionTitle}
                      onChange={(e) => onSectionTitleChange(selectedSection.id, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Genişlik (%): {sectionWidth}</Label>
                    <input
                      type="range"
                      min={25}
                      max={100}
                      step={25}
                      value={sectionWidth}
                      onChange={(e) =>
                        onSectionWidthChange(selectedSection.id, Number(e.target.value))
                      }
                      className="mt-1 w-full"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Değişiklikler otomatik kaydedilir.</p>
                </div>
              )}
              {selectedField && (
                <div className="space-y-3">
                  <div>
                    <Label>Etiket</Label>
                    <Input
                      value={fieldLabel}
                      onChange={(e) => onFieldLabelChange(selectedField.id, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Zorunlu</Label>
                    <Select
                      value={fieldRequired ? "yes" : "no"}
                      onValueChange={(v) =>
                        onFieldRequiredChange(selectedField.id, v === "yes")
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Hayır</SelectItem>
                        <SelectItem value="yes">Evet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedField.type === "select" && (
                    <div>
                      <Label>Seçenekler (satır başına bir)</Label>
                      <textarea
                        value={fieldOptions}
                        onChange={(e) =>
                          onFieldOptionsChange(selectedField.id, e.target.value)
                        }
                        className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                        rows={3}
                        placeholder="Seçenek 1&#10;Seçenek 2"
                      />
                    </div>
                  )}
                  {selectedOrphanField && (
                    <div>
                      <Label>Bölüme taşı</Label>
                      <Select
                        onValueChange={(sectionId) =>
                          moveFieldToSection(selectedField.id, sectionId)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Bölüm seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {(data?.tabs ?? []).map((tab) =>
                            (tab.sections ?? []).map((sec) => (
                              <SelectItem key={sec.id} value={sec.id}>
                                {tab.label} → {sec.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-slate-500">
                        Alanı bir bölüme atayın; formda o bölümde görünür.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => checkDeleteField(selectedField.id, selectedField.label)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Alanı sil / gizle
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">Değişiklikler otomatik kaydedilir.</p>
                </div>
              )}
              {!selectedTab && !selectedSection && !selectedField && (
                <p className="text-sm text-slate-500">
                  Düzenlemek için bir sekme, bölüm veya alan seçin.
                </p>
              )}
            </div>

            {/* Gizli alanlar */}
            {(data.hiddenFields?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-amber-800">Gizli alanlar</h3>
                <p className="mb-3 text-xs text-amber-700">
                  Bu alanlarda öğrenci verisi var; gizlendi. Gösterirseniz formda tekrar yer alır.
                </p>
                <ul className="space-y-2">
                  {data.hiddenFields.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-2 rounded border border-amber-200 bg-white px-2 py-1.5 text-sm"
                    >
                      <span className="truncate text-slate-700">{f.label}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={unhiding === f.id}
                        onClick={() => unhideField(f.id)}
                      >
                        {unhiding === f.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activePaletteType ? (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
              <PaletteFieldItem type={activePaletteType} id="overlay-palette" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Silme / Gizleme modal */}
      <Dialog open={!!deleteFieldModal} onOpenChange={() => setDeleteFieldModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alanı kaldır</DialogTitle>
            <DialogDescription>
              {deleteFieldModal?.students?.length
                ? `${deleteFieldModal.students.length} öğrencide bu alanda veri var. Alanı tamamen silmek veriyi de kaldırır. Veriyi korumak için "Gizle" seçin; alan formda görünmez ama veri saklanır.`
                : "Bu alanda hiç veri yok. Kalıcı olarak silebilirsiniz."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFieldModal(null)}>
              İptal
            </Button>
            {deleteFieldModal?.students && deleteFieldModal.students.length > 0 && (
              <Button
                variant="secondary"
                onClick={() =>
                  hideOrDeleteField(deleteFieldModal!.fieldId, true)
                }
              >
                Gizle (veriyi koru)
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() =>
                deleteFieldModal && hideOrDeleteField(deleteFieldModal.fieldId, false)
              }
            >
              {deleteFieldModal?.students?.length ? "Sil (veriyi kaldır)" : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
