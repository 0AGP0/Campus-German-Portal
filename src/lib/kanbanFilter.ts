import { DETAIL_FIELD_KEYS, FIELD_LABEL_TR } from "@/data/leadFormFields";
import type { Lead, LeadFormType, LeadStage } from "@/data/leads";
import { leadNotesText, STAGE_ORDER } from "@/data/leads";

export type KanbanFilterState = {
  search: string;
  /** Aramanın yapılacağı alanlar (en az biri; boşsa varsayılan kullanılır) */
  searchFieldKeys: string[];
  stages: LeadStage[];
  formTypes: LeadFormType[];
  /** active: kayıp olmayan (varsayılan); lost: yalnızca kayıp; all: tümü */
  lostFilter: "active" | "lost" | "all";
  /** Sütun içinde kart sırası; yıldızlı her zaman üstte */
  sortOrder: "newest" | "oldest";
};

const DEFAULT_SEARCH_KEYS = ["name", "email", "phone", "city"] as const;

export function defaultKanbanFilter(): KanbanFilterState {
  return {
    search: "",
    searchFieldKeys: [...DEFAULT_SEARCH_KEYS],
    stages: [...STAGE_ORDER],
    formTypes: ["booking", "contact", "quote", "private-documents-form"],
    lostFilter: "active",
    sortOrder: "newest",
  };
}

const LEAD_DIRECT_KEYS = [
  "id",
  "name",
  "email",
  "phone",
  "city",
  "course",
  "value",
  "createdAt",
  "source",
  "language",
  "nextStep",
] as const;

const LEAD_DIRECT_LABEL: Record<string, string> = {
  id: "Lead ID",
  name: "Ad soyad",
  email: "E-posta",
  phone: "Telefon",
  city: "Şehir",
  course: "Kurs (CRM)",
  notes: "Danışman notları",
  value: "Tahmini ücret",
  createdAt: "Kayıt tarihi",
  source: "Kaynak",
  language: "Dil",
  nextStep: "Sonraki adım",
  tags: "Etiketler",
};

export type FilterFieldOption = { key: string; label: string; group: string };

export function getFilterFieldOptions(): FilterFieldOption[] {
  const byKey = new Map<string, FilterFieldOption>();

  for (const key of LEAD_DIRECT_KEYS) {
    byKey.set(key, {
      key,
      label: LEAD_DIRECT_LABEL[key] ?? key,
      group: "alan",
    });
  }
  byKey.set("notes", {
    key: "notes",
    label: LEAD_DIRECT_LABEL.notes,
    group: "alan",
  });
  byKey.set("tags", {
    key: "tags",
    label: LEAD_DIRECT_LABEL.tags,
    group: "alan",
  });

  for (const ft of ["booking", "contact", "quote", "private-documents-form"] as const) {
    for (const k of DETAIL_FIELD_KEYS[ft]) {
      if (!byKey.has(k)) {
        byKey.set(k, {
          key: k,
          label: FIELD_LABEL_TR[k] ?? k,
          group: "alan",
        });
      }
    }
  }

  return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label, "tr"));
}

export function getLeadFieldValueForFilter(lead: Lead, key: string): string {
  if (key === "notes") return leadNotesText(lead);
  if (key === "tags") return lead.tags.map((t) => t.label).join(" ");
  if ((LEAD_DIRECT_KEYS as readonly string[]).includes(key)) {
    const v = lead[key as keyof Lead];
    if (v === undefined || v === null) return "";
    if (typeof v === "object") return "";
    return String(v);
  }
  return String(lead.formData[key] ?? "");
}

function effectiveSearchKeys(keys: string[]): string[] {
  const u = keys.filter(Boolean);
  if (u.length > 0) return u;
  return [...DEFAULT_SEARCH_KEYS];
}

export function filterLeads(leads: Lead[], f: KanbanFilterState): Lead[] {
  const q = f.search.trim().toLowerCase();
  const keys = effectiveSearchKeys(f.searchFieldKeys);

  return leads.filter((lead) => {
    const lf = f.lostFilter ?? "active";
    if (lf === "active" && lead.lost) return false;
    if (lf === "lost" && !lead.lost) return false;

    if (f.stages.length === 0) return false;
    if (!f.stages.includes(lead.stage)) return false;
    if (f.formTypes.length === 0) return false;
    if (!f.formTypes.includes(lead.formType)) return false;

    if (q) {
      const match = keys.some((fieldKey) =>
        getLeadFieldValueForFilter(lead, fieldKey).toLowerCase().includes(q),
      );
      if (!match) return false;
    }

    return true;
  });
}
