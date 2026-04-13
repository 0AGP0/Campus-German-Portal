"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Plus, Trash2 } from "lucide-react";

import { KanbanDenseCard } from "@/components/KanbanDenseCard";
import { LeadCardContextMenu } from "@/components/LeadCardContextMenu";
import { cn } from "@/lib/utils";
import { FORM_TYPE_AURORA_CARD } from "@/lib/leadFormStyle";
import { useLeadsBoard } from "@/state/LeadsBoardContext";
import type { KanbanDesignId } from "@/kanban/kanbanDesigns";
import { STAGE_ORDER, type Lead } from "@/data/leads";

export type AuroraKanbanCol = { stageId: string; label: string; items: Lead[] };

type Props = {
  cols: AuroraKanbanCol[];
  design: KanbanDesignId;
  interaction: "link" | "navigate";
};

const cardShell =
  "group block shrink-0 rounded-xl border border-slate-200/80 border-l-[4px] border-l-cg-red/35 bg-gradient-to-br from-white to-cg-red/[0.04] p-2.5 shadow-md shadow-slate-900/10 transition hover:border-cg-cyan/45 hover:border-l-cg-cyan/50 hover:shadow-lg";

/** Yalnızca sütun (stage-*) droppable’ları dikkate al; kart/scroll ölçümü karışmasın */
const kanbanCollision: CollisionDetection = (args) => {
  const stageOnly = {
    ...args,
    droppableContainers: args.droppableContainers.filter((c) => String(c.id).startsWith("stage-")),
  };
  const hit = pointerWithin(stageOnly);
  if (hit.length > 0) return hit;
  return closestCorners(stageOnly);
};

function DraggableAuroraLeadCard({
  lead,
  design,
  interaction,
  onOpenTagMenu,
}: {
  lead: Lead;
  design: KanbanDesignId;
  interaction: "link" | "navigate";
  onOpenTagMenu: (clientX: number, clientY: number, lead: Lead) => void;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lead-${lead.id}`,
  });

  const tone = FORM_TYPE_AURORA_CARD[lead.formType];
  /** DragOverlay kullanılırken kaynak DOM’a transform verme — sadece gizle */
  const style: CSSProperties = {
    opacity: isDragging ? 0 : 1,
  };

  const className = cn(
    cardShell,
    tone,
    "relative select-none touch-none",
    isDragging && "pointer-events-none z-[100]",
    !isDragging && "cursor-grab active:cursor-grabbing",
  );

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onOpenTagMenu(e.clientX, e.clientY, lead);
  }

  const inner = <KanbanDenseCard lead={lead} variant="aurora" />;

  if (interaction === "link") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onContextMenu={handleContextMenu}
        className={className}
      >
        <Link
          href={`/kanban/lead/${lead.id}?from=${design}`}
          className="block text-left text-inherit no-underline"
          draggable={false}
        >
          {inner}
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onContextMenu={handleContextMenu}
      className={className}
    >
      <div
        role="button"
        tabIndex={0}
        className="block text-left outline-none ring-offset-white focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-cg-cyan/50"
        onClick={() => router.push(`/kanban/lead/${lead.id}?from=${design}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(`/kanban/lead/${lead.id}?from=${design}`);
          }
        }}
      >
        {inner}
      </div>
    </div>
  );
}

function StageDropColumn({
  col,
  design,
  interaction,
  onOpenTagMenu,
}: {
  col: AuroraKanbanCol;
  design: KanbanDesignId;
  interaction: "link" | "navigate";
  onOpenTagMenu: (clientX: number, clientY: number, lead: Lead) => void;
}) {
  const { removeKanbanColumn } = useLeadsBoard();
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${col.stageId}` });
  const isBuiltIn = STAGE_ORDER.includes(col.stageId);

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-0 w-72 max-w-[min(18rem,100%)] shrink-0 flex-col rounded-2xl border border-slate-300/50 bg-white/85 shadow-sm shadow-slate-900/[0.06] ring-1 ring-slate-200/60",
        isOver && "ring-2 ring-cg-cyan/35 ring-offset-1 ring-offset-white",
      )}
    >
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 rounded-t-2xl border-b border-slate-200/70 bg-gradient-to-r from-cg-red/[0.06] via-white to-cg-cyan/[0.08] px-3 py-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-slate-800">{col.label}</span>
          <span
            className="shrink-0 rounded-md bg-cg-cyan/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-cg-cyan-dark ring-1 ring-cg-cyan/25"
            aria-label={`${col.items.length} kayıt`}
          >
            {col.items.length}
          </span>
        </div>
        <button
          type="button"
          title={
            isBuiltIn
              ? "Yerleşik aşamayı panodan kaldır (kayıtlar başka görünür aşamaya taşınır)"
              : "Ek sütunu kaldır (kayıtlar «Yeni» aşamasına taşınır)"
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const msg = isBuiltIn
              ? col.items.length > 0
                ? `«${col.label}» yerleşik aşamasını panodan kaldırmak üzeresiniz. Bu sütundaki ${col.items.length} kayıt başka bir görünür aşamaya taşınacak. Devam edilsin mi?`
                : `«${col.label}» aşamasını panodan kaldırmak istediğinize emin misiniz?`
              : col.items.length > 0
                ? `Bu sütunda ${col.items.length} kayıt var. Sütun silinince tümü «Yeni» aşamasına taşınır. Devam edilsin mi?`
                : "Bu ek sütunu silmek istediğinize emin misiniz?";
            if (!window.confirm(msg)) return;
            void removeKanbanColumn(col.stageId);
          }}
          className={cn(
            "shrink-0 rounded-lg p-1.5 text-cg-red transition hover:bg-cg-red/15 active:scale-95",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cg-red/45",
          )}
          aria-label={isBuiltIn ? "Yerleşik aşamayı panodan kaldır" : "Ek sütunu sil"}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
      <div
        className={cn(
          "scrollbar-none flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden overscroll-y-contain p-3",
          "rounded-b-2xl bg-slate-100/40",
          isOver && "bg-cg-cyan/8",
        )}
      >
        {col.items.map((lead) => (
          <DraggableAuroraLeadCard
            key={lead.id}
            lead={lead}
            design={design}
            interaction={interaction}
            onOpenTagMenu={onOpenTagMenu}
          />
        ))}
        {col.items.length === 0 ? (
          <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-500">
            Kartı buraya bırak
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AddKanbanColumnCard() {
  const { addKanbanColumn } = useLeadsBoard();
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = val.trim();
    if (t) void addKanbanColumn(t).catch(() => undefined);
    setVal("");
    setOpen(false);
  }

  if (open) {
    return (
      <form
        onSubmit={submit}
        className="flex h-full min-h-0 w-72 max-w-[min(18rem,100%)] shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-cg-cyan/15"
      >
        <p className="mb-2 text-[11px] font-semibold text-cg-cyan-dark">Sütun adı</p>
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Örn. Beklemede"
          className="mb-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-cg-cyan focus:outline-none focus:ring-1 focus:ring-cg-cyan/30"
        />
        <div className="mt-auto flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setVal("");
            }}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-cg-cyan py-2 text-[12px] font-semibold text-white hover:brightness-105"
          >
            Ekle
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex h-full min-h-[200px] w-72 max-w-[min(18rem,100%)] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 text-slate-600 transition hover:border-cg-cyan/50 hover:bg-cg-cyan/5 hover:text-cg-cyan-dark"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cg-yellow/25 ring-1 ring-cg-yellow/40">
        <Plus className="h-5 w-5 text-cg-cyan-dark" strokeWidth={1.75} />
      </span>
      <span className="text-[12px] font-semibold text-slate-800">Yeni sütun</span>
    </button>
  );
}

/** Aurora demosu ve Pipeline — sürükle-bırak ile aşama değişimi */
export function AuroraKanbanColumns({ cols, design, interaction }: Props) {
  const { moveLeadToStage, addTag, setLeadLost, setLeadStarred } = useLeadsBoard();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tagMenu, setTagMenu] = useState<null | { lead: Lead; x: number; y: number }>(null);
  const [overlayMount, setOverlayMount] = useState(false);
  useEffect(() => {
    setOverlayMount(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
  );

  const validStageIds = useMemo(() => new Set(cols.map((c) => c.stageId)), [cols]);

  const activeLead = useMemo(() => {
    if (!activeId || !activeId.startsWith("lead-")) return null;
    const id = activeId.replace(/^lead-/, "");
    for (const c of cols) {
      const hit = c.items.find((l) => l.id === id);
      if (hit) return hit;
    }
    return null;
  }, [activeId, cols]);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith("stage-")) return;
    const stage = overId.replace(/^stage-/, "");
    if (!validStageIds.has(stage)) return;
    const leadId = String(active.id).replace(/^lead-/, "");
    let currentStage: string | null = null;
    for (const c of cols) {
      if (c.items.some((l) => l.id === leadId)) {
        currentStage = c.stageId;
        break;
      }
    }
    if (currentStage === stage) return;
    void moveLeadToStage(leadId, stage).catch(() => undefined);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function openTagMenu(clientX: number, clientY: number, lead: Lead) {
    setTagMenu({ lead, x: clientX, y: clientY });
  }

  const dragOverlayUi = (
    <DragOverlay dropAnimation={null} zIndex={9999} style={{ cursor: "grabbing" }}>
      {activeLead ? (
        <div
          className={cn(
            cardShell,
            FORM_TYPE_AURORA_CARD[activeLead.formType],
            "max-w-[288px] shadow-2xl shadow-slate-900/20 ring-1 ring-cg-cyan/25",
          )}
        >
          <KanbanDenseCard lead={activeLead} variant="aurora" />
        </div>
      ) : null}
    </DragOverlay>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      autoScroll={{ acceleration: 10, threshold: { x: 0.14, y: 0.14 } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-3 pb-0 pt-2 sm:px-5 sm:pt-3">
        <div
          className={cn(
            "min-h-0 min-w-0 w-full max-w-full flex-1 flex flex-col overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth",
            "[scrollbar-width:thin] [scrollbar-color:rgba(12,192,223,0.45)_rgba(241,245,249,1)]",
            "[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100",
            "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cg-cyan/35 [&::-webkit-scrollbar-thumb:hover]:bg-cg-cyan/50",
          )}
        >
          <div className="flex h-full min-h-0 min-w-max items-stretch gap-4 pb-2 pr-1 pt-0.5">
            {cols.map((col) => (
              <StageDropColumn
                key={col.stageId}
                col={col}
                design={design}
                interaction={interaction}
                onOpenTagMenu={openTagMenu}
              />
            ))}
            <AddKanbanColumnCard />
          </div>
        </div>
      </div>

      {tagMenu ? (
        <LeadCardContextMenu
          x={tagMenu.x}
          y={tagMenu.y}
          onClose={() => setTagMenu(null)}
          onSubmitTag={(label) => void addTag(tagMenu.lead.id, label).catch(() => undefined)}
          onMarkLost={() => void setLeadLost(tagMenu.lead.id, true).catch(() => undefined)}
          hideMarkLost={tagMenu.lead.lost}
          onRestoreFromLost={
            tagMenu.lead.lost
              ? () => void setLeadLost(tagMenu.lead.id, false).catch(() => undefined)
              : undefined
          }
          onToggleStar={() =>
            void setLeadStarred(tagMenu.lead.id, !tagMenu.lead.starred).catch(() => undefined)
          }
          starred={tagMenu.lead.starred}
        />
      ) : null}

      {overlayMount ? createPortal(dragOverlayUi, document.body) : dragOverlayUi}
    </DndContext>
  );
}
