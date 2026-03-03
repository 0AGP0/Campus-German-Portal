"use client";

import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";

export function SectionDropZone({
  id,
  children,
  isEmpty,
}: {
  id: string;
  children: ReactNode;
  isEmpty?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "section", sectionId: id } });
  const showPlaceholder = isOver && isEmpty;

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[72px] rounded-lg border-2 border-dashed transition-colors ${
        showPlaceholder
          ? "border-primary bg-primary/5"
          : "border-slate-200 bg-slate-50/50"
      }`}
    >
      {showPlaceholder && isEmpty ? (
        <div className="flex min-h-[72px] items-center justify-center py-4 text-sm text-primary/70">
          Alanı buraya bırakın
        </div>
      ) : isEmpty ? (
        <div className="flex min-h-[72px] items-center justify-center py-4 text-xs text-slate-400">
          Alan eklemek için yukarıdaki paletten sürükleyin
        </div>
      ) : (
        children
      )}
    </div>
  );
}
