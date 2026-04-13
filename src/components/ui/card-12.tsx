import * as React from "react";

import { cn } from "@/lib/utils";
import type { Lead, LeadFormType } from "@/data/leads";
import { formTypeCardTone } from "@/lib/leadFormStyle";

/** Pipeline kartı — forma göre renk; etiket + değer satırları */
export interface CrmLeadCardProps {
  studentName: string;
  city: string;
  sourceChannel: string;
  formLabel: string;
  formType: LeadFormType;
  courseLine: string;
  valueDisplay: string;
  priority: Lead["priority"];
  language: string;
  createdAt: string;
  nextStep: string;
  className?: string;
}

function LabeledRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-[13px] leading-snug">
      <span className="w-[5.25rem] shrink-0 text-slate-500">{label}</span>
      <div className="min-w-0 flex-1 text-slate-800">{children}</div>
    </div>
  );
}

const CrmLeadCard = React.forwardRef<HTMLDivElement, CrmLeadCardProps>(
  (
    {
      studentName,
      city,
      formLabel,
      formType,
      courseLine,
      valueDisplay,
      priority,
      language,
      createdAt,
      nextStep,
      className,
    },
    ref,
  ) => {
    const tone = formTypeCardTone(formType);
    const deger = valueDisplay === "—" ? "—" : `${valueDisplay} · Öncelik ${priority}`;
    const kayitDil = `${createdAt} · ${language}`;

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[300px] rounded-lg border p-3.5 font-sans shadow-sm transition hover:brightness-[1.02]",
          tone.shell,
          className,
        )}
      >
        <p className="text-[15px] font-semibold leading-tight text-slate-900">{studentName}</p>
        <p className="mt-1 text-xs text-slate-600">
          {city} · {formLabel}
        </p>

        <div className="mt-3 space-y-2.5 border-t border-slate-200/80 pt-3">
          <LabeledRow label="Kurs">
            <span className="line-clamp-3">{courseLine}</span>
          </LabeledRow>
          <LabeledRow label="Tahmini ücret">{deger}</LabeledRow>
          <LabeledRow label="Kayıt / dil">{kayitDil}</LabeledRow>
        </div>

        <div className={cn("mt-3 rounded-md border px-2.5 py-2", tone.nextBox)}>
          <p className={cn("text-[11px] font-medium", tone.nextTitle)}>Sonraki adım</p>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-800">{nextStep}</p>
        </div>
      </div>
    );
  },
);

CrmLeadCard.displayName = "CrmLeadCard";

export const OpportunityCard = CrmLeadCard;
export type OpportunityCardProps = CrmLeadCardProps;

export { CrmLeadCard };
