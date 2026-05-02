/** Yerleşik + dinamik Kanban sütun kimlikleri */
export type LeadStage = string;

/** Siteden gelen form tipleri — kart rengi ve alan seti */
export type LeadFormType = "booking" | "contact" | "quote" | "private-documents-form";

/** CRM’de danışman notları — kronolojik günlük satırı */
export type LeadNoteEntry = {
  id: string;
  body: string;
  /** ISO datetime */
  createdAt: string;
  author?: string;
};

export type Lead = {
  id: string;
  /** Görünen tam ad (avatar / başlık) */
  name: string;
  email: string;
  phone: string;
  stage: LeadStage;
  course: string;
  city: string;
  /** Danışman notları (en eski → en yeni; UI’da genelde ters gösterilir) */
  noteLog: LeadNoteEntry[];
  value: string;
  createdAt: string;
  formType: LeadFormType;
  /** Form alanları: camelCase anahtar → değer (booking / contact / quote şeması) */
  formData: Record<string, string>;
  source: string;
  priority: "A" | "B" | "C";
  language: string;
  nextStep: string;
  /** Kayba çekilen lead’ler panoda gizlenir; filtreden görüntülenebilir */
  lost: boolean;
  /** Sağ tık ile yıldız; sütunda üstte tutulur */
  starred: boolean;
  /** CRM etiketleri (kalıcı) */
  tags: { id: string; label: string }[];
};

/** Kanban önizlemesi / arama: tüm not metinleri birleşik */
export function leadNotesText(lead: Lead): string {
  return lead.noteLog.map((n) => n.body).join("\n");
}

/** Kartta son not özeti */
export function leadLatestNoteBody(lead: Lead): string {
  const last = lead.noteLog[lead.noteLog.length - 1];
  return last?.body ?? "";
}

export const STAGE_ORDER: LeadStage[] = ["yeni", "iletisim", "teklif", "kazanildi"];

/** Tasarım önizlemeleri (Swiss vb.) — yalnızca yerleşik dört sütun */
export function defaultKanbanColumnDefs(): { id: string; label: string }[] {
  return STAGE_ORDER.map((id) => ({ id, label: STAGE_LABEL[id] ?? id }));
}

export const STAGE_LABEL: Record<string, string> = {
  yeni: "Yeni",
  iletisim: "İletişimde",
  teklif: "Teklif",
  kazanildi: "Kazanıldı",
};

/** Başlangıçta boş; kayıtlar webhook / API ile `ingestLead` veya kalıcı katman üzerinden gelir */
export const LEADS: Lead[] = [];

export function getLeadById(id: string): Lead | undefined {
  return LEADS.find((l) => l.id === id);
}
