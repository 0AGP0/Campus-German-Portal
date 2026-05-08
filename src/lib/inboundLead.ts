import type { Lead, LeadFormType } from "../data/leads";

/**
 * Make.com / webhook gövdesi — `formData` anahtarları `DETAIL_FIELD_KEYS` ile uyumlu camelCase olmalı.
 * Örnek: booking için firstName, lastName, email, program, …
 */
/** Make.com vb. bazen sayı/boolean gönderir; webhook’ta stringe çevrilir */
export function normalizeInboundFormData(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "object") {
      try {
        out[k] = JSON.stringify(v);
      } catch {
        out[k] = String(v);
      }
    } else {
      out[k] = String(v);
    }
  }
  return out;
}

export type InboundLeadPayload = {
  formType: LeadFormType;
  /** Form alanları (string); boş alanlar göndermeyebilir veya "" olabilir */
  formData: Record<string, string>;
  /** Yoksa rastgele üretilir */
  id?: string;
  /** Kartta “Kaynak” — örn. "Booking formu", "İletişim formu" */
  source?: string;
  /** Varsayılan aşama */
  stage?: Lead["stage"];
};

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `lead-${Date.now()}`;
}

function pick(...vals: (string | undefined)[]): string {
  for (const v of vals) {
    const s = v?.trim();
    if (s) return s;
  }
  return "—";
}

function courseLine(formType: LeadFormType, fd: Record<string, string>): string {
  if (formType === "booking") {
    return [fd.program, fd.programType, fd.selectedProgram].filter(Boolean).join(" · ") || "—";
  }
  if (formType === "contact") {
    return [fd.level, fd.applicationType].filter(Boolean).join(" · ") || pick(fd.message);
  }
  return (
    [fd.program, fd.courseTitle, fd.level, fd.courseSelection, fd.startDateLabel]
      .filter(Boolean)
      .join(" · ") || "—"
  );
}

function displayName(fd: Record<string, string>): string {
  const first = fd.firstName?.trim() ?? "";
  const last = fd.lastName?.trim() ?? "";
  const combined = [first, last].filter(Boolean).join(" ");
  if (combined) return combined;
  return pick(fd.email, fd.phone, undefined) !== "—" ? pick(fd.email, fd.phone) : "İsimsiz başvuru";
}

/**
 * Webhook’tan gelen düz JSON’u `Lead` modeline çevirir (CRM’e eklemeden önce).
 */
export function leadFromInboundPayload(p: InboundLeadPayload): Lead {
  const fd = { ...p.formData };
  const formType = p.formType;
  const id = p.id?.trim() || newId();
  const formDate = pick(fd.formDate);
  const createdAt = formDate !== "—" ? formDate : new Date().toISOString().slice(0, 10);

  return {
    id,
    name: displayName(fd),
    email: pick(fd.email),
    phone: pick(fd.phone),
    stage: p.stage ?? "yeni",
    course: courseLine(formType, fd),
    city: pick(fd.city),
    noteLog: [],
    value: pick(fd.price),
    createdAt,
    formType,
    formData: fd,
    source: p.source ?? "Site",
    priority: "B",
    language: pick(fd.siteLanguage, "—"),
    nextStep: "—",
    lost: false,
    starred: false,
    tags: [],
  };
}
