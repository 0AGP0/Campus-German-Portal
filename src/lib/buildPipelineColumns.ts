import type { Lead } from "@/data/leads";

export type KanbanColumnDef = { id: string; label: string };

export type KanbanColumnSortOrder = "newest" | "oldest";

export type PipelineColumn = { stageId: string; label: string; items: Lead[] };

function createdAtMs(iso: string): number {
  const s = iso.includes("T") ? iso : `${iso}T12:00:00.000Z`;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

/** Yıldızlı üstte; sonra oluşturulma zamanına göre */
export function sortLeadsForKanbanColumn(items: Lead[], sortOrder: KanbanColumnSortOrder): Lead[] {
  return [...items].sort((a, b) => {
    if (a.starred !== b.starred) return a.starred ? -1 : 1;
    const ta = createdAtMs(a.createdAt);
    const tb = createdAtMs(b.createdAt);
    return sortOrder === "newest" ? tb - ta : ta - tb;
  });
}

export function buildPipelineColumns(
  leads: Lead[],
  columns: KanbanColumnDef[],
  sortOrder: KanbanColumnSortOrder = "newest",
): PipelineColumn[] {
  return columns.map(({ id, label }) => {
    const raw = leads.filter((l) => l.stage === id);
    return {
      stageId: id,
      label,
      items: sortLeadsForKanbanColumn(raw, sortOrder),
    };
  });
}
