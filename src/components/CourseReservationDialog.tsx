"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FileText } from "lucide-react";
import type { Lead } from "@/data/leads";

export function CourseReservationDialog({ lead }: { lead: Lead }) {
  const canOpen = lead.formType === "quote" || lead.formType === "booking";
  const disabledClass = canOpen ? "" : "pointer-events-none opacity-50";
  const label = useMemo(() => (lead.formType === "quote" ? "Teklif belgesi (önizleme)" : "Course Reservation"), [lead]);

  return (
    <Link
      href={`/kanban/lead/${encodeURIComponent(lead.id)}/course-reservation`}
      className={`inline-flex items-center gap-2 rounded-lg border border-cg-cyan/40 bg-cg-cyan/10 px-3 py-2 text-[13px] font-semibold text-cg-cyan-dark transition hover:bg-cg-cyan/18 ${disabledClass}`}
    >
      <FileText className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
