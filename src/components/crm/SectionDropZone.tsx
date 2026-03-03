"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export function SectionDropZone({
  id,
  children,
  isEmpty,
  className,
}: {
  id: string;
  children: React.ReactNode;
  isEmpty: boolean;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { sectionId: id } });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[80px] rounded-lg border-2 border-dashed transition-colors",
        isOver ? "border-primary bg-primary/10" : "border-slate-200 bg-slate-50/50",
        isEmpty && !isOver && "flex items-center justify-center",
        className
      )}
    >
      {children}
    </div>
  );
}
