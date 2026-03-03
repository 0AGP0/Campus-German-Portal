"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Type, Mail, Hash, Calendar, List, Trash2 } from "lucide-react";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Type,
  email: Mail,
  number: Hash,
  date: Calendar,
  select: List,
};

const typeLabels: Record<string, string> = {
  text: "Metin",
  email: "E-posta",
  number: "Sayı",
  date: "Tarih",
  select: "Seçenek listesi",
};

export function SortableFieldItem({
  id,
  fieldKey,
  label,
  type,
  required,
  selected,
  onSelect,
  onDelete,
}: {
  id: string;
  fieldKey: string;
  label: string;
  type: string;
  required: boolean;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "field", fieldId: id } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const Icon = typeIcons[type] ?? Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      } ${isDragging ? "opacity-80 shadow" : ""}`}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-4 text-slate-400" />
      </button>
      <Icon className="size-4 text-slate-500" />
      <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{label}</span>
      {required && (
        <span className="text-xs text-amber-600">Zorunlu</span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
        title="Alanı sil / gizle"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
