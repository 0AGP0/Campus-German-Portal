import { useEffect, useMemo, useState } from "react";

import { AuroraKanbanColumns } from "@/components/AuroraKanbanColumns";
import { KanbanFiltersBar } from "@/components/KanbanFiltersBar";
import { buildPipelineColumns } from "@/lib/buildPipelineColumns";
import { STAGE_ORDER } from "@/data/leads";
import { defaultKanbanFilter, filterLeads, type KanbanFilterState } from "@/lib/kanbanFilter";
import type { KanbanDesignId } from "@/kanban/kanbanDesigns";
import { useLeads, useLeadsBoard } from "@/state/LeadsBoardContext";

type Props = {
  design: KanbanDesignId;
  interaction: "link" | "navigate";
  filter?: KanbanFilterState;
  onFilterChange?: (next: KanbanFilterState) => void;
};

export function KanbanFilterPipeline({ design, interaction, filter: controlledFilter, onFilterChange }: Props) {
  const leads = useLeads();
  const { ready, kanbanColumns } = useLeadsBoard();
  const [inner, setInner] = useState<KanbanFilterState>(() => ({
    ...defaultKanbanFilter(),
    stages: [...STAGE_ORDER],
  }));
  const filter = controlledFilter ?? inner;
  const setFilter = onFilterChange ?? setInner;
  const isControlled = controlledFilter !== undefined;

  useEffect(() => {
    if (isControlled) return;
    const idSet = new Set(kanbanColumns.map((c) => c.id));
    setInner((f) => {
      let stages = f.stages.filter((s) => idSet.has(s));
      for (const id of kanbanColumns.map((c) => c.id)) {
        if (!stages.includes(id)) stages = [...stages, id];
      }
      return { ...f, stages };
    });
  }, [kanbanColumns, isControlled]);

  const cols = useMemo(
    () =>
      buildPipelineColumns(filterLeads(leads, filter), kanbanColumns, filter.sortOrder ?? "newest"),
    [leads, filter, kanbanColumns],
  );

  const noLeads = ready && leads.length === 0;

  return (
    <>
      <div className="relative z-40 shrink-0">
        <KanbanFiltersBar value={filter} onChange={setFilter} stageColumns={kanbanColumns} />
      </div>
      <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {noLeads ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-4 pt-6">
            <p className="max-w-md rounded-xl border border-cg-red/20 bg-gradient-to-br from-white/90 to-cg-red/[0.06] px-4 py-3 text-center text-[13px] leading-relaxed text-slate-600 shadow-lg shadow-cg-red/10 backdrop-blur-sm">
              Henüz kayıt yok. API veya webhook ile lead eklendiğinde burada görünecek.
            </p>
          </div>
        ) : null}
        <AuroraKanbanColumns cols={cols} design={design} interaction={interaction} />
      </div>
    </>
  );
}
