"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export function SortableFieldItem({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border bg-white py-2 pl-2 pr-3 ${isDragging ? "z-50 shadow-lg opacity-90" : ""} ${className}`}
    >
      <button
        type="button"
        className="touch-none cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Sırayı değiştir"
      >
        <GripVertical className="size-4" />
      </button>
      {children}
    </div>
  );
}
