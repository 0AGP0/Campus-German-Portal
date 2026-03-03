"use client";

import { useDraggable } from "@dnd-kit/core";
import { type CSS } from "@dnd-kit/utilities";
import { GripVertical, Type, Mail, Hash, Calendar, List } from "lucide-react";

export type PaletteFieldType = "text" | "email" | "number" | "date" | "select";

const icons: Record<PaletteFieldType, React.ComponentType<{ className?: string }>> = {
  text: Type,
  email: Mail,
  number: Hash,
  date: Calendar,
  select: List,
};

const labels: Record<PaletteFieldType, string> = {
  text: "Metin",
  email: "E-posta",
  number: "Sayı",
  date: "Tarih",
  select: "Seçenek listesi",
};

export function PaletteFieldItem({ type, id }: { type: PaletteFieldType; id: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type: "palette", fieldType: type },
  });
  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const Icon = icons[type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex cursor-grab items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm active:cursor-grabbing ${isDragging ? "opacity-50 shadow-md" : "hover:border-primary/40 hover:bg-slate-50"}`}
    >
      <GripVertical className="size-4 text-slate-400" />
      <Icon className="size-4 text-primary" />
      <span className="font-medium text-slate-700">{labels[type]}</span>
    </div>
  );
}
