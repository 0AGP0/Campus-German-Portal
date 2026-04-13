import type { Lead as PrismaLead, LeadNote, LeadTag } from "@prisma/client";
import type { Lead, LeadNoteEntry } from "@/data/leads";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function noteToEntry(n: LeadNote): LeadNoteEntry {
  return {
    id: n.id,
    body: n.body,
    createdAt: n.createdAt.toISOString(),
    ...(n.author ? { author: n.author } : {}),
  };
}

function normalizeFormData(raw: unknown): Record<string, string> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === null || v === undefined) continue;
    out[k] = typeof v === "string" ? v : String(v);
  }
  return out;
}

export function prismaLeadToDto(
  row: PrismaLead & { notes: LeadNote[]; tags: LeadTag[] },
): Lead {
  const formData = normalizeFormData(row.formData);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    stage: row.stage,
    course: row.course,
    city: row.city,
    noteLog: row.notes.map(noteToEntry),
    value: row.value,
    createdAt: isoDate(row.createdAt),
    formType: row.formType as Lead["formType"],
    formData,
    source: row.source,
    priority: row.priority as Lead["priority"],
    language: row.language,
    nextStep: row.nextStep,
    lost: row.lost,
    starred: row.starred,
    tags: row.tags.map((t) => ({ id: t.id, label: t.label })),
  };
}
