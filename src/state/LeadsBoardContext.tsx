import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  STAGE_LABEL,
  STAGE_ORDER,
  type Lead,
  type LeadStage,
} from "@/data/leads";
import type { KanbanColumnDef } from "@/lib/buildPipelineColumns";
import {
  apiAddKanbanColumn,
  apiAddLeadNote,
  apiAddLeadTag,
  apiBootstrap,
  apiHideBuiltinStage,
  apiPatchLead,
  apiRemoveKanbanColumn,
  apiRemoveLeadTag,
} from "@/lib/api";

export type LeadTag = {
  id: string;
  label: string;
};

type Ctx = {
  leads: Lead[];
  /** API yüklenene kadar false */
  ready: boolean;
  loadError: string | null;
  reload: (options?: { soft?: boolean }) => Promise<void>;
  /** Yerleşik + eklenen sütunlar (sıralı) */
  kanbanColumns: KanbanColumnDef[];
  addKanbanColumn: (label: string) => Promise<void>;
  /** Ek sütunu siler veya yerleşik aşamayı panodan gizler (lead’ler taşınır). */
  removeKanbanColumn: (columnId: string) => Promise<void>;
  moveLeadToStage: (leadId: string, stage: LeadStage) => Promise<void>;
  setLeadLost: (leadId: string, lost: boolean) => Promise<void>;
  setLeadStarred: (leadId: string, starred: boolean) => Promise<void>;
  getLeadById: (id: string) => Lead | undefined;
  getTagsForLead: (leadId: string) => LeadTag[];
  addTag: (leadId: string, label: string) => Promise<void>;
  removeTag: (leadId: string, tagId: string) => Promise<void>;
  addLeadNote: (leadId: string, body: string, author?: string) => Promise<void>;
};

const LeadsBoardContext = createContext<Ctx | null>(null);

function replaceLead(prev: Lead[], next: Lead): Lead[] {
  return prev.map((l) => (l.id === next.id ? next : l));
}

export function LeadsBoardProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [extraColumns, setExtraColumns] = useState<KanbanColumnDef[]>([]);
  const [hiddenBuiltinStageIds, setHiddenBuiltinStageIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async (options?: { soft?: boolean }) => {
    const soft = options?.soft === true;
    if (!soft) {
      setLoadError(null);
      setReady(false);
      setLeads([]);
      setExtraColumns([]);
      setHiddenBuiltinStageIds([]);
    }
    try {
      const { leads: list, extraColumns: extras, hiddenBuiltinStageIds: hidden } = await apiBootstrap();
      setLeads(list);
      setExtraColumns(extras);
      setHiddenBuiltinStageIds(hidden ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Yükleme hatası");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const kanbanColumns = useMemo((): KanbanColumnDef[] => {
    const hidden = new Set(hiddenBuiltinStageIds);
    const base = STAGE_ORDER.filter((id) => !hidden.has(id)).map((id) => ({
      id,
      label: STAGE_LABEL[id] ?? id,
    }));
    return [...base, ...extraColumns];
  }, [extraColumns, hiddenBuiltinStageIds]);

  const addKanbanColumn = useCallback(async (label: string) => {
    const col = await apiAddKanbanColumn(label.trim() || "Yeni sütun");
    setExtraColumns((prev) => [...prev, col]);
  }, []);

  const removeKanbanColumn = useCallback(async (columnId: string) => {
    try {
      if (STAGE_ORDER.includes(columnId)) {
        await apiHideBuiltinStage(columnId);
      } else {
        await apiRemoveKanbanColumn(columnId);
        setExtraColumns((prev) => prev.filter((c) => c.id !== columnId));
      }
      await reload({ soft: true });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Sütun kaldırılamadı");
    }
  }, [reload]);

  const moveLeadToStage = useCallback(async (leadId: string, stage: LeadStage) => {
    let before: Lead | undefined;
    setLeads((prev) => {
      const current = prev.find((l) => l.id === leadId);
      if (!current || current.stage === stage) return prev;
      before = current;
      return replaceLead(prev, { ...current, stage });
    });
    if (!before) return;
    const rollback = before;

    try {
      const updated = await apiPatchLead(leadId, { stage });
      setLeads((prev) => replaceLead(prev, updated));
    } catch (e) {
      setLeads((prev) => replaceLead(prev, rollback));
      throw e;
    }
  }, []);

  const setLeadLost = useCallback(async (leadId: string, lost: boolean) => {
    let before: Lead | undefined;
    setLeads((prev) => {
      const current = prev.find((l) => l.id === leadId);
      if (!current || current.lost === lost) return prev;
      before = current;
      return replaceLead(prev, { ...current, lost });
    });
    if (!before) return;
    const rollback = before;
    try {
      const updated = await apiPatchLead(leadId, { lost });
      setLeads((prev) => replaceLead(prev, updated));
    } catch (e) {
      setLeads((prev) => replaceLead(prev, rollback));
      throw e;
    }
  }, []);

  const setLeadStarred = useCallback(async (leadId: string, starred: boolean) => {
    let before: Lead | undefined;
    setLeads((prev) => {
      const current = prev.find((l) => l.id === leadId);
      if (!current || current.starred === starred) return prev;
      before = current;
      return replaceLead(prev, { ...current, starred });
    });
    if (!before) return;
    const rollback = before;
    try {
      const updated = await apiPatchLead(leadId, { starred });
      setLeads((prev) => replaceLead(prev, updated));
    } catch (e) {
      setLeads((prev) => replaceLead(prev, rollback));
      throw e;
    }
  }, []);

  const getLeadById = useCallback((id: string) => leads.find((l) => l.id === id), [leads]);

  const getTagsForLead = useCallback(
    (leadId: string) => leads.find((l) => l.id === leadId)?.tags ?? [],
    [leads],
  );

  const addTag = useCallback(async (leadId: string, label: string) => {
    const t = label.trim();
    if (!t) return;
    const updated = await apiAddLeadTag(leadId, t);
    setLeads((prev) => replaceLead(prev, updated));
  }, []);

  const removeTag = useCallback(async (leadId: string, tagId: string) => {
    const updated = await apiRemoveLeadTag(leadId, tagId);
    setLeads((prev) => replaceLead(prev, updated));
  }, []);

  const addLeadNote = useCallback(async (leadId: string, body: string, author?: string) => {
    const updated = await apiAddLeadNote(leadId, body, author);
    setLeads((prev) => replaceLead(prev, updated));
  }, []);

  const value = useMemo(
    () => ({
      leads,
      ready,
      loadError,
      reload,
      kanbanColumns,
      addKanbanColumn,
      removeKanbanColumn,
      moveLeadToStage,
      setLeadLost,
      setLeadStarred,
      getLeadById,
      getTagsForLead,
      addTag,
      removeTag,
      addLeadNote,
    }),
    [
      leads,
      ready,
      loadError,
      reload,
      kanbanColumns,
      addKanbanColumn,
      removeKanbanColumn,
      moveLeadToStage,
      setLeadLost,
      setLeadStarred,
      getLeadById,
      getTagsForLead,
      addTag,
      removeTag,
      addLeadNote,
    ],
  );

  return <LeadsBoardContext.Provider value={value}>{children}</LeadsBoardContext.Provider>;
}

export function useLeadsBoard() {
  const ctx = useContext(LeadsBoardContext);
  if (!ctx) {
    throw new Error("useLeadsBoard yalnızca LeadsBoardProvider içinde kullanılmalıdır.");
  }
  return ctx;
}

export function useLeads() {
  return useLeadsBoard().leads;
}
