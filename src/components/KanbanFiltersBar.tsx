import { Bookmark, Filter, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { getFilterFieldOptions, type KanbanFilterState } from "@/lib/kanbanFilter";
import type { LeadFormType, LeadStage } from "@/data/leads";
import type { KanbanColumnDef } from "@/lib/buildPipelineColumns";
import { FORM_TYPE_LABEL_TR } from "@/data/leadFormFields";
import {
  addSavedKanbanFilter,
  loadSavedKanbanFilters,
  mergeSavedStagesWithColumns,
  removeSavedKanbanFilter,
  type SavedKanbanFilterPreset,
} from "@/lib/savedKanbanFilters";

type Props = {
  value: KanbanFilterState;
  onChange: (next: KanbanFilterState) => void;
  stageColumns: KanbanColumnDef[];
};

const FORM_TYPES: LeadFormType[] = ["booking", "contact", "quote"];

function toggle<T extends string>(arr: T[], item: T): T[] {
  if (arr.includes(item)) return arr.filter((x) => x !== item);
  return [...arr, item];
}

function toggleSearchField(keys: string[], key: string): string[] {
  if (keys.includes(key)) return keys.filter((k) => k !== key);
  return [...keys, key];
}

export function KanbanFiltersBar({ value, onChange, stageColumns }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [fieldListQuery, setFieldListQuery] = useState("");
  const [saveName, setSaveName] = useState("");
  const [savedList, setSavedList] = useState<SavedKanbanFilterPreset[]>(() => loadSavedKanbanFilters());

  const fieldOptions = useMemo(() => getFilterFieldOptions(), []);

  const filteredFieldOptions = useMemo(() => {
    const q = fieldListQuery.trim().toLowerCase();
    if (!q) return fieldOptions;
    return fieldOptions.filter((o) => o.label.toLowerCase().includes(q) || o.key.toLowerCase().includes(q));
  }, [fieldOptions, fieldListQuery]);

  const searchScopeSummary = useMemo(() => {
    const labels = value.searchFieldKeys
      .map((k) => fieldOptions.find((o) => o.key === k)?.label ?? k)
      .slice(0, 4);
    const extra = value.searchFieldKeys.length - labels.length;
    let s = labels.join(", ");
    if (extra > 0) s += ` +${extra}`;
    return s || "Varsayılan alanlar";
  }, [fieldOptions, value.searchFieldKeys]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function setSearch(s: string) {
    onChange({ ...value, search: s });
  }

  function setSearchFieldKeys(keys: string[]) {
    onChange({ ...value, searchFieldKeys: keys });
  }

  function setStages(stages: LeadStage[]) {
    onChange({ ...value, stages });
  }

  function setFormTypes(formTypes: LeadFormType[]) {
    onChange({ ...value, formTypes });
  }

  function clearAll() {
    onChange({
      search: "",
      searchFieldKeys: ["name", "email", "phone", "city"],
      stages: stageColumns.map((c) => c.id as LeadStage),
      formTypes: ["booking", "contact", "quote"],
      lostFilter: "active",
      sortOrder: "newest",
    });
    setOpen(false);
  }

  function applyPreset(p: SavedKanbanFilterPreset) {
    const merged = mergeSavedStagesWithColumns(
      p.state,
      stageColumns.map((c) => c.id),
    );
    onChange(merged);
    setOpen(false);
  }

  function handleSaveFilter() {
    const name = saveName.trim() || `Filtre ${new Date().toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}`;
    addSavedKanbanFilter(name, value);
    setSaveName("");
    setSavedList(loadSavedKanbanFilters());
  }

  function handleDeletePreset(id: string) {
    removeSavedKanbanFilter(id);
    setSavedList(loadSavedKanbanFilters());
  }

  const placeholder = "Seçili alanlarda ara…";

  return (
    <div
      ref={rootRef}
      className="relative shrink-0 overflow-visible border-b border-cg-red/15 bg-gradient-to-r from-cg-red/[0.04] via-slate-100/90 to-cg-cyan/[0.06] backdrop-blur-xl"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(255,58,58,0.07)_0%,rgba(12,192,223,0.06)_35%,transparent_50%,rgba(255,210,31,0.09)_100%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-[min(100%,900px)] items-center gap-2 px-4 py-2.5 sm:px-6">
        <div className="relative shrink-0">
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition shadow-sm",
              open
                ? "border-cg-cyan/50 bg-cg-cyan/15 text-cg-cyan-dark ring-1 ring-cg-cyan/35"
                : "border-slate-200 bg-white text-slate-700 hover:border-cg-cyan/40 hover:bg-cg-cyan/8",
            )}
            title="Filtreler"
          >
            <Filter className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>

          {open ? (
            <div
              className="absolute left-0 top-[calc(100%+6px)] z-[200] w-[min(calc(100vw-1.5rem),420px)] rounded-xl border border-slate-200 bg-white py-3 shadow-xl shadow-slate-900/15 ring-1 ring-cg-cyan/15"
              role="dialog"
              aria-label="Kanban filtreleri"
            >
              <div className="scrollbar-kanban-filter max-h-[min(75vh,520px)] overflow-y-auto overscroll-contain px-3 pr-2">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-cg-cyan-dark">
                  Arama kapsamı (çoklu)
                </p>
                <p className="mb-2 text-[11px] leading-snug text-slate-600">
                  Metin, işaretlediğiniz tüm alanlarda aranır (herhangi biri eşleşirse lead listelenir).
                </p>
                <input
                  type="search"
                  value={fieldListQuery}
                  onChange={(e) => setFieldListQuery(e.target.value)}
                  placeholder="Alan ara…"
                  className="mb-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[12px] text-slate-900 placeholder:text-slate-400 focus:border-cg-cyan focus:outline-none focus:ring-1 focus:ring-cg-cyan/30"
                />
                <div className="scrollbar-kanban-filter-sm max-h-[min(28vh,200px)] space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 pr-1.5">
                  {filteredFieldOptions.map((opt) => {
                    const on = value.searchFieldKeys.includes(opt.key);
                    return (
                      <label
                        key={opt.key}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition",
                          on ? "bg-cg-cyan/12 text-slate-900" : "text-slate-700 hover:bg-white",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => setSearchFieldKeys(toggleSearchField(value.searchFieldKeys, opt.key))}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-cg-cyan focus:ring-cg-cyan/40"
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-cg-cyan-dark underline-offset-2 hover:underline"
                    onClick={() =>
                      setSearchFieldKeys(fieldOptions.map((o) => o.key))
                    }
                  >
                    Tümünü seç
                  </button>
                  <button
                    type="button"
                    className="text-[11px] text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
                    onClick={() => setSearchFieldKeys(["name", "email", "phone", "city"])}
                  >
                    Varsayılana dön
                  </button>
                </div>

                <div className="my-3 h-px bg-slate-100" />

                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-cg-cyan-dark">
                  <Bookmark className="h-3 w-3" strokeWidth={2} />
                  Kayıtlı filtreler
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="İsim ver (isteğe bağlı)"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12px] text-slate-900 placeholder:text-slate-400 focus:border-cg-cyan focus:outline-none focus:ring-1 focus:ring-cg-cyan/30"
                  />
                  <button
                    type="button"
                    onClick={handleSaveFilter}
                    className="shrink-0 rounded-lg bg-cg-cyan px-3 py-1.5 text-[11px] font-semibold text-white hover:brightness-105"
                  >
                    Kaydet
                  </button>
                </div>
                {savedList.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {savedList.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5"
                      >
                        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-800" title={p.name}>
                          {p.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => applyPreset(p)}
                          className="shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold text-cg-cyan-dark hover:bg-cg-cyan/10"
                        >
                          Uygula
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(p.id)}
                          className="shrink-0 rounded p-1 text-slate-400 hover:bg-cg-red/10 hover:text-cg-red"
                          aria-label="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-500">Henüz kayıtlı filtre yok.</p>
                )}

                <div className="my-3 h-px bg-slate-100" />

                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-cg-cyan-dark">Aşama</p>
                <div className="flex flex-wrap gap-1.5">
                  {stageColumns.map((col) => {
                    const on = value.stages.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setStages(toggle(value.stages, col.id as LeadStage))}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                          on
                            ? "bg-cg-cyan/20 text-cg-cyan-dark ring-1 ring-cg-cyan/40"
                            : "bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
                        )}
                      >
                        {col.label}
                      </button>
                    );
                  })}
                </div>

                <div className="my-3 h-px bg-slate-100" />

                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-cg-cyan-dark">Form türü</p>
                <div className="flex flex-wrap gap-1.5">
                  {FORM_TYPES.map((ft) => {
                    const on = value.formTypes.includes(ft);
                    return (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => setFormTypes(toggle(value.formTypes, ft))}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                          on
                            ? "bg-cg-yellow/35 text-slate-900 ring-1 ring-cg-yellow/60"
                            : "bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
                        )}
                      >
                        {FORM_TYPE_LABEL_TR[ft]}
                      </button>
                    );
                  })}
                </div>

                <div className="my-3 h-px bg-slate-100" />

                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-cg-cyan-dark">
                  Sütun sırası
                </p>
                <p className="mb-2 text-[11px] leading-snug text-slate-600">
                  Yıldızlı kartlar her zaman üstte kalır; aşağıdaki seçenek yalnızca diğerlerinin sırasını belirler.
                </p>
                <div className="flex flex-col gap-1.5">
                  {(
                    [
                      { id: "newest" as const, label: "En yeni üstte" },
                      { id: "oldest" as const, label: "En eski üstte" },
                    ] as const
                  ).map((opt) => {
                    const cur = value.sortOrder ?? "newest";
                    const on = cur === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange({ ...value, sortOrder: opt.id })}
                        className={cn(
                          "rounded-lg px-2.5 py-2 text-left text-[12px] font-semibold transition",
                          on
                            ? "bg-cg-cyan/15 text-cg-cyan-dark ring-1 ring-cg-cyan/35"
                            : "bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-white",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="my-3 h-px bg-slate-100" />

                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-cg-cyan-dark">Kayıp</p>
                <p className="mb-2 text-[11px] leading-snug text-slate-600">
                  Kayba çekilen kayıtlar varsayılan olarak panoda görünmez; buradan yalnızca kayıpları veya tümünü
                  seçebilirsiniz.
                </p>
                <div className="flex flex-col gap-1.5">
                  {(
                    [
                      { id: "active" as const, label: "Aktif (kayıp olmayan)" },
                      { id: "lost" as const, label: "Sadece kayıp" },
                      { id: "all" as const, label: "Tüm kayıtlar" },
                    ] as const
                  ).map((opt) => {
                    const cur = value.lostFilter ?? "active";
                    const on = cur === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange({ ...value, lostFilter: opt.id })}
                        className={cn(
                          "rounded-lg px-2.5 py-2 text-left text-[12px] font-semibold transition",
                          on
                            ? "bg-cg-yellow/25 text-slate-900 ring-1 ring-cg-yellow/50"
                            : "bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-white",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2 border-t border-slate-100 px-3 pt-2">
                <button
                  type="button"
                  onClick={clearAll}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Tümünü sıfırla
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-inner shadow-slate-900/5 ring-1 ring-inset ring-cg-cyan/10">
          <Search className="relative h-3.5 w-3.5 shrink-0 text-cg-cyan-dark" aria-hidden />
          <input
            type="search"
            value={value.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="relative min-w-0 flex-1 bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {value.search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
              aria-label="Aramayı temizle"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <p
          className="hidden max-w-[200px] truncate text-[10px] leading-tight text-slate-500 sm:block"
          title={searchScopeSummary}
        >
          Alanlar: {searchScopeSummary}
        </p>
      </div>
    </div>
  );
}
