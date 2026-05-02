import type { LeadFormType } from "@/data/leads";

export { FORM_TYPE_LABEL_TR } from "@/data/leadFormFields";

/** Aurora Kanban — logo renkleri, açık kart yüzeyi */
export const FORM_TYPE_AURORA_CARD: Record<LeadFormType, string> = {
  booking:
    "border-cg-cyan/45 bg-gradient-to-br from-white via-cg-cyan/8 to-slate-50 ring-1 ring-inset ring-cg-cyan/20 shadow-sm hover:border-cg-cyan/70 hover:shadow-md",
  contact:
    "border-cg-cyan/35 bg-gradient-to-br from-white via-emerald-50/80 to-slate-50 ring-1 ring-inset ring-emerald-200/60 shadow-sm hover:shadow-md",
  quote:
    "border-cg-yellow/50 bg-gradient-to-br from-white via-amber-50/90 to-slate-50 ring-1 ring-inset ring-cg-yellow/35 shadow-sm hover:shadow-md",
  "private-documents-form":
    "border-violet-400/45 bg-gradient-to-br from-white via-violet-50/85 to-slate-50 ring-1 ring-inset ring-violet-300/50 shadow-sm hover:shadow-md",
};

/** Eski beyaz CRM kartı (kullanılırsa) */
export function formTypeCardTone(form: LeadFormType) {
  const map = {
    booking: {
      shell:
        "border-sky-400/50 bg-gradient-to-br from-sky-50 via-white to-white ring-1 ring-sky-500/10 shadow-sky-950/10",
      nextBox: "border-sky-200/90 bg-sky-50/95",
      nextTitle: "text-sky-900",
    },
    contact: {
      shell:
        "border-emerald-400/45 bg-gradient-to-br from-emerald-50 via-white to-white ring-1 ring-emerald-500/10 shadow-emerald-950/10",
      nextBox: "border-emerald-200/90 bg-emerald-50/95",
      nextTitle: "text-emerald-900",
    },
    quote: {
      shell:
        "border-amber-400/45 bg-gradient-to-br from-amber-50 via-white to-white ring-1 ring-amber-500/10 shadow-amber-950/10",
      nextBox: "border-amber-200/90 bg-amber-50/95",
      nextTitle: "text-amber-900",
    },
    "private-documents-form": {
      shell:
        "border-violet-400/45 bg-gradient-to-br from-violet-50 via-white to-white ring-1 ring-violet-500/10 shadow-violet-950/10",
      nextBox: "border-violet-200/90 bg-violet-50/95",
      nextTitle: "text-violet-900",
    },
  } as const;
  return map[form];
}
