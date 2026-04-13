import { STAGE_ORDER } from "@/data/leads";

/** Gizleme sonrası görünür kalacak ilk aşama (lead taşıma hedefi) */
export function pickFallbackStageForHidden(
  hiddenBuiltinIds: Iterable<string>,
  extraColumnIds: string[],
): string {
  const hidden = new Set(hiddenBuiltinIds);
  for (const id of STAGE_ORDER) {
    if (!hidden.has(id)) return id;
  }
  if (extraColumnIds.length > 0) return extraColumnIds[0];
  throw new Error("NO_VISIBLE_STAGE");
}

export function countVisibleKanbanColumns(hiddenBuiltinIds: string[], extraColumnCount: number): number {
  const hidden = new Set(hiddenBuiltinIds);
  const visibleBuiltins = STAGE_ORDER.filter((id) => !hidden.has(id)).length;
  return visibleBuiltins + extraColumnCount;
}
