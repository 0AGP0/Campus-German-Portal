import type { KanbanFilterState } from "@/lib/kanbanFilter";
import { defaultKanbanFilter } from "@/lib/kanbanFilter";
import type { LeadFormType, LeadStage } from "@/data/leads";
import { STAGE_ORDER } from "@/data/leads";

const STORAGE_KEY = "campus-crm-saved-kanban-filters-v1";

export type SavedKanbanFilterPreset = {
  id: string;
  name: string;
  state: KanbanFilterState;
  savedAt: number;
};

function parseFilterState(raw: unknown): KanbanFilterState {
  const d = defaultKanbanFilter();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;

  const search = typeof o.search === "string" ? o.search : d.search;

  let searchFieldKeys = d.searchFieldKeys;
  if (Array.isArray(o.searchFieldKeys) && o.searchFieldKeys.every((x) => typeof x === "string")) {
    searchFieldKeys = o.searchFieldKeys as string[];
  } else if (typeof (o as { searchFieldKey?: string }).searchFieldKey === "string") {
    searchFieldKeys = [(o as { searchFieldKey: string }).searchFieldKey];
  }

  let stages = d.stages;
  if (Array.isArray(o.stages) && o.stages.every((x) => typeof x === "string")) {
    stages = o.stages as LeadStage[];
  }

  let formTypes = d.formTypes;
  if (Array.isArray(o.formTypes) && o.formTypes.every((x) => typeof x === "string")) {
    formTypes = o.formTypes as LeadFormType[];
  }

  let lostFilter = d.lostFilter;
  const rawLf = o.lostFilter;
  if (rawLf === "active" || rawLf === "lost" || rawLf === "all") {
    lostFilter = rawLf;
  }

  let sortOrder = d.sortOrder;
  if (o.sortOrder === "newest" || o.sortOrder === "oldest") {
    sortOrder = o.sortOrder;
  }

  return { search, searchFieldKeys, stages, formTypes, lostFilter, sortOrder };
}

export function loadSavedKanbanFilters(): SavedKanbanFilterPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: SavedKanbanFilterPreset[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      if (typeof r.id !== "string" || typeof r.name !== "string") continue;
      const savedAt = typeof r.savedAt === "number" ? r.savedAt : Date.now();
      out.push({
        id: r.id,
        name: r.name,
        state: parseFilterState(r.state),
        savedAt,
      });
    }
    return out.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export function persistSavedKanbanFilters(presets: SavedKanbanFilterPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    /* ignore quota */
  }
}

export function addSavedKanbanFilter(name: string, state: KanbanFilterState): SavedKanbanFilterPreset {
  const presets = loadSavedKanbanFilters();
  const preset: SavedKanbanFilterPreset = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `f-${Date.now()}`,
    name: name.trim() || `Filtre ${presets.length + 1}`,
    state: {
      ...state,
      stages: [...state.stages],
      formTypes: [...state.formTypes],
      searchFieldKeys: [...state.searchFieldKeys],
      lostFilter: state.lostFilter,
      sortOrder: state.sortOrder,
    },
    savedAt: Date.now(),
  };
  persistSavedKanbanFilters([preset, ...presets].slice(0, 20));
  return preset;
}

export function removeSavedKanbanFilter(id: string): void {
  persistSavedKanbanFilters(loadSavedKanbanFilters().filter((p) => p.id !== id));
}

/** Kayıtlı ön ayar uygulanırken dinamik sütunlarla uyum için aşamaları güncelle */
export function mergeSavedStagesWithColumns(
  state: KanbanFilterState,
  columnIds: string[],
): KanbanFilterState {
  const idSet = new Set(columnIds);
  let stages = state.stages.filter((s) => idSet.has(s));
  for (const id of columnIds) {
    if (!stages.includes(id as LeadStage)) stages = [...stages, id as LeadStage];
  }
  if (stages.length === 0) stages = (columnIds.length ? columnIds : [...STAGE_ORDER]) as LeadStage[];
  return { ...state, stages };
}
