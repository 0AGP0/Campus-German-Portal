"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode } from "react";
import { GripVertical } from "lucide-react";

export function SortableSectionItem({
  id,
  title,
  width,
  selected,
  onSelect,
  onDelete,
  children,
}: {
  id: string;
  title: string;
  width: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "section", sectionId: id } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-slate-200 hover:border-slate-300"
      } ${isDragging ? "opacity-80 shadow-lg" : ""}`}
    >
      <div
        className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2"
        onClick={onSelect}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            className="touch-none cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="size-4 text-slate-400" />
          </button>
          <span className="truncate font-medium text-slate-800">{title}</span>
          <span className="text-xs text-slate-400">%{width}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
          title="Bölümü sil"
        >
          <span className="text-sm font-bold">×</span>
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
