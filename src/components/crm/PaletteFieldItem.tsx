"use client";

import { useDraggable } from "@dnd-kit/core";
import { Type, Mail, Hash, Calendar, List } from "lucide-react";

const icons: Record<string, React.ReactNode> = {
  text: <Type className="size-4" />,
  email: <Mail className="size-4" />,
  number: <Hash className="size-4" />,
  date: <Calendar className="size-4" />,
  select: <List className="size-4" />,
};

export function PaletteFieldItem({ type, label }: { type: string; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, label, isFromPalette: true },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex cursor-grab items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 shadow-sm active:cursor-grabbing ${isDragging ? "opacity-50" : "hover:border-primary/40 hover:bg-primary/5"}`}
    >
      {icons[type]}
      {label}
    </div>
  );
}
