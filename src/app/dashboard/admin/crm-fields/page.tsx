"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { SortableFieldItem } from "@/components/crm/SortableFieldItem";
import { SortableSectionItem } from "@/components/crm/SortableSectionItem";
import { PaletteFieldItem } from "@/components/crm/PaletteFieldItem";
import { SectionDropZone } from "@/components/crm/SectionDropZone";
import { Plus, Pencil, Trash2, LayoutGrid, PanelTop } from "lucide-react";

type CrmField = {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  options: string | null;
  sectionId: string | null;
};

type CrmSection = {
  id: string;
  tabId: string;
  title: string;
  order: number;
  width?: number;
  fields: CrmField[];
};

type CrmTab = {
  id: string;
  label: string;
  order: number;
  sections: CrmSection[];
};

type BuilderData = {
  tabs: CrmTab[];
  orphanFields: CrmField[];
};

const typeLabels: Record<string, string> = {
  text: "Metin",
  email: "E-posta",
  select: "Seçenek",
  date: "Tarih",
  number: "Sayı",
};

const PALETTE_TYPES: { type: string; label: string }[] = [
  { type: "text", label: "Metin" },
  { type: "email", label: "E-posta" },
  { type: "number", label: "Sayı" },
  { type: "date", label: "Tarih" },
  { type: "select", label: "Seçenek listesi" },
];

export default function AdminCrmFieldsPage() {
  const router = useRouter();
  const [data, setData] = useState<BuilderData>({ tabs: [], orphanFields: [] });
  const [loading, setLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [addTabOpen, setAddTabOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [addFieldSectionId, setAddFieldSectionId] = useState<string | null>(null);
  const [editFieldId, setEditFieldId] = useState<string | null>(null);
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  const [editTabId, setEditTabId] = useState<string | null>(null);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionTabId, setNewSectionTabId] = useState("");
  const [fieldForm, setFieldForm] = useState({
    key: "",
    label: "",
    type: "text" as string,
    required: false,
    options: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchBuilder() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm-builder");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      setData({ tabs: json.tabs ?? [], orphanFields: json.orphanFields ?? [] });
      if (!activeTabId && json.tabs?.length > 0) {
        setActiveTabId(json.tabs[0].id);
      }
    } catch {
      setData({ tabs: [], orphanFields: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBuilder();
  }, []);

  const activeTab = data.tabs.find((t) => t.id === activeTabId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const isFromPalette = (active.data.current as { isFromPalette?: boolean })?.isFromPalette;
    if (isFromPalette && active.data.current?.type) {
      const sectionId = over.id as string;
      const type = (active.data.current as { type: string }).type;
      const label = (active.data.current as { label: string }).label ?? typeLabels[type] ?? type;
      createFieldFromPalette(sectionId, type, label);
      return;
    }
    if (active.id === over.id) return;
    const sectionIds = activeTab?.sections.map((s) => s.id) ?? [];
    if (sectionIds.includes(active.id as string)) {
      handleDragEndSections(event);
    } else {
      const section = activeTab?.sections.find((s) => s.fields.some((f) => f.id === active.id));
      if (section) handleDragEndFields(section.id, event);
    }
  }

  async function createFieldFromPalette(sectionId: string, type: string, label: string) {
    const section = activeTab?.sections.find((s) => s.id === sectionId) ?? data.tabs.flatMap((t) => t.sections).find((s) => s.id === sectionId);
    const order = section?.fields?.length ?? 0;
    const key = `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      const res = await fetch("/api/crm-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          label: `Yeni ${label}`,
          type,
          required: false,
          order,
          sectionId,
        }),
      });
      if (res.ok) fetchBuilder();
    } catch {
      // ignore
    }
  }
  function handleDragEndFields(sectionId: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const section = activeTab?.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const oldOrder = section.fields.map((f) => f.id);
    const newOrder = arrayMove(oldOrder, oldOrder.indexOf(active.id as string), oldOrder.indexOf(over.id as string));
    Promise.all(
      newOrder.map((id, index) =>
        fetch(`/api/crm-fields/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: index }),
        })
      )
    ).then(() => fetchBuilder());
  }

  function handleDragEndSections(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !activeTab) return;
    const oldOrder = activeTab.sections.map((s) => s.id);
    const newOrder = arrayMove(oldOrder, oldOrder.indexOf(active.id as string), oldOrder.indexOf(over.id as string));
    Promise.all(
      newOrder.map((id, index) =>
        fetch(`/api/crm-sections/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: index }),
        })
      )
    ).then(() => fetchBuilder());
  }

  async function handleAddTab() {
    if (!newTabLabel.trim()) return;
    setSubmitLoading(true);
    setError("");
    try {
      const res = await fetch("/api/crm-tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newTabLabel.trim(), order: data.tabs.length }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Eklenemedi");
        return;
      }
      setAddTabOpen(false);
      setNewTabLabel("");
      setActiveTabId(json.id);
      fetchBuilder();
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleAddSection() {
    const tabId = newSectionTabId || activeTabId;
    if (!newSectionTitle.trim() || !tabId) return;
    setSubmitLoading(true);
    setError("");
    try {
      const tab = data.tabs.find((t) => t.id === tabId);
      const res = await fetch("/api/crm-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabId,
          title: newSectionTitle.trim(),
          order: tab?.sections?.length ?? 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Eklenemedi");
        return;
      }
      setAddSectionOpen(false);
      setNewSectionTitle("");
      setNewSectionTabId("");
      fetchBuilder();
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleAddField() {
    if (!addFieldSectionId || !fieldForm.key.trim() || !fieldForm.label.trim()) return;
    setSubmitLoading(true);
    setError("");
    try {
      const section = activeTab?.sections.find((s) => s.id === addFieldSectionId);
      const res = await fetch("/api/crm-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: fieldForm.key.trim().replace(/[^a-zA-Z0-9_]/g, ""),
          label: fieldForm.label.trim(),
          type: fieldForm.type,
          required: fieldForm.required,
          order: section?.fields?.length ?? 0,
          sectionId: addFieldSectionId,
          ...(fieldForm.type === "select" && fieldForm.options.trim() && { options: fieldForm.options.trim() }),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Eklenemedi");
        return;
      }
      setAddFieldOpen(false);
      setAddFieldSectionId(null);
      setFieldForm({ key: "", label: "", type: "text", required: false, options: "" });
      fetchBuilder();
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleUpdateField() {
    if (!editFieldId) return;
    setSubmitLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/crm-fields/${editFieldId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: fieldForm.label.trim(),
          type: fieldForm.type,
          required: fieldForm.required,
          ...(fieldForm.type === "select" ? { options: fieldForm.options.trim() || null } : { options: null }),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Güncellenemedi");
        return;
      }
      setEditFieldId(null);
      fetchBuilder();
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDeleteField(id: string) {
    try {
      await fetch(`/api/crm-fields/${id}`, { method: "DELETE" });
      fetchBuilder();
    } catch {
      // ignore
    }
  }

  async function handleUpdateSection() {
    if (!editSectionId) return;
    setSubmitLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/crm-sections/${editSectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSectionTitle.trim() }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Güncellenemedi");
        return;
      }
      setEditSectionId(null);
      setNewSectionTitle("");
      fetchBuilder();
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleSectionWidthChange(sectionId: string, width: number) {
    try {
      await fetch(`/api/crm-sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ width }),
      });
      fetchBuilder();
    } catch {
      // ignore
    }
  }

  async function handleDeleteSection(id: string) {
    try {
      await fetch(`/api/crm-sections/${id}`, { method: "DELETE" });
      fetchBuilder();
    } catch {
      // ignore
    }
  }

  async function handleUpdateTab() {
    if (!editTabId) return;
    setSubmitLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/crm-tabs/${editTabId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newTabLabel.trim() }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Güncellenemedi");
        return;
      }
      setEditTabId(null);
      setNewTabLabel("");
      fetchBuilder();
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDeleteTab(id: string) {
    try {
      await fetch(`/api/crm-tabs/${id}`, { method: "DELETE" });
      if (activeTabId === id) setActiveTabId(data.tabs[0]?.id ?? null);
      fetchBuilder();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-12 text-center text-slate-500">Yükleniyor…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">CRM Sayfa Oluşturucu</h1>
        <p className="mt-1 text-slate-500">
          Sağdaki alan tiplerini canvas’a sürükleyin. Konteyner genişliğini kaydırıcı ile ayarlayın.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Canvas - sol/orta */}
        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Sekmeler */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        {data.tabs.map((tab) => (
          <div key={tab.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 rounded-t-lg border px-4 py-2 text-sm font-medium transition-colors ${
                activeTabId === tab.id
                  ? "border-b-0 border-slate-200 bg-white text-primary shadow-sm"
                  : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <PanelTop className="size-4" />
              {tab.label}
            </button>
            <button
              type="button"
              onClick={() => { setEditTabId(tab.id); setNewTabLabel(tab.label); }}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              aria-label="Sekmeyi düzenle"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteTab(tab.id)}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Sekmeyi sil"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        <Dialog open={addTabOpen} onOpenChange={setAddTabOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="size-4" />
              Sekme ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sekme ekle</DialogTitle>
              <DialogDescription>Sekme adı (örn. Kişisel Bilgiler)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Sekme adı</Label>
              <Input value={newTabLabel} onChange={(e) => setNewTabLabel(e.target.value)} placeholder="Örn. Kişisel Bilgiler" />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddTabOpen(false)}>İptal</Button>
                <Button onClick={handleAddTab} disabled={submitLoading}>{submitLoading ? "Ekleniyor…" : "Ekle"}</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* İçerik */}
      {!activeTabId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutGrid className="size-12 text-slate-300" />
            <p className="mt-4 text-slate-500">Sekme yok. &quot;Sekme ekle&quot; ile başlayın.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Konteynerlar</h2>
            <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" onClick={() => setNewSectionTabId(activeTabId)}>
                  <Plus className="size-4" />
                  Konteyner ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Konteyner ekle</DialogTitle>
                  <DialogDescription>Bu sekmeye bir konteyner (bölüm) ekleyin.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Label>Başlık</Label>
                  <Input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="Örn. Kişisel Bilgiler" />
                  <div className="space-y-2">
                    <Label>Sekme</Label>
                    <Select value={newSectionTabId || activeTabId} onValueChange={setNewSectionTabId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {data.tabs.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddSectionOpen(false)}>İptal</Button>
                    <Button onClick={handleAddSection} disabled={submitLoading}>{submitLoading ? "Ekleniyor…" : "Ekle"}</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeTab?.sections.map((s) => s.id) ?? []} strategy={verticalListSortingStrategy}>
              {activeTab?.sections.map((section) => (
                <SortableSectionItem key={section.id} id={section.id}>
                  <Card className="overflow-hidden border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-slate-50/50 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{section.title}</span>
                        <Badge variant="secondary" className="text-xs">{section.fields.length} alan</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-slate-500">Genişlik</Label>
                          <input
                            type="range"
                            min={25}
                            max={100}
                            step={25}
                            value={section.width ?? 100}
                            onChange={(e) => handleSectionWidthChange(section.id, Number(e.target.value))}
                            className="h-2 w-24 accent-primary"
                          />
                          <span className="text-xs font-medium text-slate-500">{(section.width ?? 100)}%</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setEditSectionId(section.id); setNewSectionTitle(section.title); }}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => {
                            setAddFieldSectionId(section.id);
                            setFieldForm({ key: "", label: "", type: "text", required: false, options: "" });
                            setAddFieldOpen(true);
                          }}
                        >
                          <Plus className="size-4" />
                          Alan ekle
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <SectionDropZone id={section.id} isEmpty={section.fields.length === 0}>
                      {section.fields.length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-400">Buraya alan bırakın veya &quot;Alan ekle&quot; ile ekleyin</p>
                      ) : (
                        <SortableContext items={section.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {section.fields.map((f) => (
                                <SortableFieldItem key={f.id} id={f.id}>
                                  <div className="flex flex-1 items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <span className="font-medium text-slate-800">{f.label}</span>
                                      <span className="ml-2 font-mono text-xs text-slate-400">{f.key}</span>
                                      <Badge variant="secondary" className="ml-2 text-xs">{typeLabels[f.type] ?? f.type}</Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditFieldId(f.id);
                                          setFieldForm({ key: f.key, label: f.label, type: f.type, required: f.required, options: f.options ?? "" });
                                        }}
                                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                      >
                                        <Pencil className="size-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteField(f.id)}
                                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    </div>
                                  </div>
                                </SortableFieldItem>
                              ))
                            }
                          </div>
                        </SortableContext>
                      )}
                      </SectionDropZone>
                    </CardContent>
                  </Card>
                </SortableSectionItem>
              ))}
            </SortableContext>
          </DndContext>

          {activeTab?.sections.length === 0 && (
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-slate-400 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              onClick={() => { setNewSectionTitle(""); setNewSectionTabId(activeTabId); setAddSectionOpen(true); }}
              role="button"
              tabIndex={0}
            >
              <LayoutGrid className="size-12" />
              <span className="mt-4 text-sm font-medium">Bu sekmeye konteyner eklemek için tıklayın</span>
            </div>
          )}
        </div>
      )}

        </div>
        {/* Sağ palet - alan tipleri */}
        <aside className="w-64 shrink-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Alan tipleri</h3>
          <p className="mb-4 text-xs text-slate-500">Sürükleyip canvas’taki konteynera bırakın</p>
          <div className="space-y-2">
            {PALETTE_TYPES.map(({ type, label }) => (
              <PaletteFieldItem key={type} type={type} label={label} />
            ))}
          </div>
        </aside>
      </div>

      {/* Modallar: Sekme / Konteyner / Alan düzenle */}
      <Dialog open={!!editTabId} onOpenChange={(open) => !open && setEditTabId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sekmeyi düzenle</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Label>Sekme adı</Label>
            <Input value={newTabLabel} onChange={(e) => setNewTabLabel(e.target.value)} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTabId(null)}>İptal</Button>
              <Button onClick={handleUpdateTab} disabled={submitLoading}>Kaydet</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editSectionId} onOpenChange={(open) => !open && setEditSectionId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Konteyneri düzenle</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Label>Başlık</Label>
            <Input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditSectionId(null)}>İptal</Button>
              <Button onClick={handleUpdateSection} disabled={submitLoading}>Kaydet</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addFieldOpen || !!editFieldId} onOpenChange={(open) => { if (!open) { setAddFieldOpen(false); setAddFieldSectionId(null); setEditFieldId(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editFieldId ? "Alanı düzenle" : "Alana ekle"}</DialogTitle>
            <DialogDescription>{editFieldId ? "Etiket, tip ve seçenekleri güncelleyin." : "Bu konteynera yeni alan ekleyin."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alan anahtarı</Label>
              <Input
                value={fieldForm.key}
                onChange={(e) => setFieldForm((p) => ({ ...p, key: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") }))}
                placeholder="ornekAlan"
                disabled={!!editFieldId}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Etiket</Label>
              <Input value={fieldForm.label} onChange={(e) => setFieldForm((p) => ({ ...p, label: e.target.value }))} placeholder="Örn. Ad Soyad" />
            </div>
            <div className="space-y-2">
              <Label>Tip</Label>
              <Select value={fieldForm.type} onValueChange={(v) => setFieldForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Metin</SelectItem>
                  <SelectItem value="email">E-posta</SelectItem>
                  <SelectItem value="select">Seçenek listesi</SelectItem>
                  <SelectItem value="date">Tarih</SelectItem>
                  <SelectItem value="number">Sayı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {fieldForm.type === "select" && (
              <div className="space-y-2">
                <Label>Seçenekler (virgül veya satırla ayırın)</Label>
                <textarea
                  value={fieldForm.options}
                  onChange={(e) => setFieldForm((p) => ({ ...p, options: e.target.value }))}
                  placeholder="Seçenek1, Seçenek2"
                  className="min-h-[80px] w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="field-required"
                checked={fieldForm.required}
                onChange={(e) => setFieldForm((p) => ({ ...p, required: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-primary"
              />
              <Label htmlFor="field-required">Zorunlu</Label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => (setAddFieldOpen(false), setEditFieldId(null))}>İptal</Button>
              {editFieldId ? (
                <Button onClick={handleUpdateField} disabled={submitLoading}>Kaydet</Button>
              ) : (
                <Button onClick={handleAddField} disabled={submitLoading || !addFieldSectionId}>{submitLoading ? "Ekleniyor…" : "Ekle"}</Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {data.orphanFields.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Sekmesiz alanlar</CardTitle>
            <p className="text-xs text-slate-500">Bu alanlar henüz bir konteynera atanmadı.</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.orphanFields.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2">
                  <span className="font-medium text-slate-800">{f.label}</span>
                  <Badge variant="secondary">{typeLabels[f.type] ?? f.type}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
