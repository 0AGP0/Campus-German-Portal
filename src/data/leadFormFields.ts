import type { Lead, LeadFormType } from "./leads";

/** Kanban kartında gösterilecek alan sırası (özet) */
export const CARD_PREVIEW_KEYS: Record<LeadFormType, readonly string[]> = {
  booking: [
    "program",
    "selectedProgram",
    "startDate",
    "city",
    "country",
    "email",
    "price",
    "formDate",
  ],
  contact: [
    "phone",
    "email",
    "city",
    "appointmentDate",
    "level",
    "applicationType",
    "formDate",
  ],
  quote: [
    "program",
    "level",
    "numberOfMonths",
    "email",
    "visaRequirement",
    "accommodation",
    "price",
    "formDate",
  ],
};

/**
 * Lead detayında gösterilecek tüm alanlar (form tipine göre tam set).
 * Kaynak: booking / contact / quote form şemaları.
 */
export const DETAIL_FIELD_KEYS: Record<LeadFormType, readonly string[]> = {
  booking: [
    "firstName",
    "lastName",
    "email",
    "program",
    "programType",
    "selectedProgram",
    "bundle",
    "startDate",
    "preferredTime",
    "visaRequirement",
    "accommodationRequirement",
    "airportTransferPackage",
    "placeOfBirth",
    "dateOfBirth",
    "passportNumber",
    "nationality",
    "address",
    "postalCode",
    "city",
    "country",
    "message",
    "price",
    /** Hafta sayısı — fiyat dilimi + kurs süresi (örn. 12) */
    "courseWeeks",
    "sourcePage",
    "formDate",
  ],
  contact: [
    "firstName",
    "phone",
    "email",
    "city",
    "sourcePage",
    "message",
    "appointmentDate",
    "level",
    "applicationType",
    "experienceDuration",
    "educationInformation",
    "languagesKnown",
    "formDate",
    "siteLanguage",
  ],
  quote: [
    "firstName",
    "phone",
    "email",
    "program",
    "level",
    "numberOfMonths",
    "visaRequirement",
    "accommodation",
    "airportPickup",
    "price",
    "formDate",
    "sourcePage",
  ],
};

export const FORM_TYPE_LABEL_TR: Record<LeadFormType, string> = {
  booking: "Booking",
  contact: "İletişim formu",
  quote: "Teklif formu",
};

export const FIELD_LABEL_TR: Record<string, string> = {
  firstName: "Ad",
  lastName: "Soyad",
  email: "E-posta",
  phone: "Telefon",
  program: "Program",
  programType: "Program tipi",
  selectedProgram: "Seçilen program",
  bundle: "Paket",
  startDate: "Başlangıç tarihi",
  preferredTime: "Tercih edilen saat",
  visaRequirement: "Vize ihtiyacı",
  accommodationRequirement: "Konaklama ihtiyacı",
  airportTransferPackage: "Havalimanı transfer paketi",
  placeOfBirth: "Doğum yeri",
  dateOfBirth: "Doğum tarihi",
  passportNumber: "Pasaport no",
  nationality: "Uyruk",
  address: "Adres",
  postalCode: "Posta kodu",
  city: "Şehir",
  country: "Ülke",
  message: "Mesaj",
  price: "Fiyat",
  courseWeeks: "Kurs süresi (hafta)",
  sourcePage: "Kaynak sayfa",
  formDate: "Form tarihi",
  appointmentDate: "Randevu tarihi",
  level: "Seviye",
  applicationType: "Başvuru tipi",
  experienceDuration: "Deneyim süresi",
  educationInformation: "Eğitim bilgisi",
  languagesKnown: "Bilinen diller",
  siteLanguage: "Site dili",
  numberOfMonths: "Ay sayısı",
  accommodation: "Konaklama",
  airportPickup: "Havalimanı karşılama",
};

export function getKanbanCardFieldRows(lead: Lead): { label: string; value: string }[] {
  const keys = CARD_PREVIEW_KEYS[lead.formType];
  const rows: { label: string; value: string }[] = [];
  for (const key of keys) {
    const raw = lead.formData[key];
    if (raw === undefined || raw === null) continue;
    const s = String(raw).trim();
    if (!s) continue;
    rows.push({
      label: FIELD_LABEL_TR[key] ?? key,
      value: s,
    });
  }
  return rows;
}

/** Kanban kartı — önizleme alanlarını kısa bölümlere ayırır */
const KANBAN_CARD_SECTIONS: Record<LeadFormType, { title: string; keys: readonly string[] }[]> = {
  booking: [
    { title: "Program", keys: ["program", "selectedProgram", "startDate"] },
    { title: "Konum", keys: ["city", "country"] },
    { title: "İletişim", keys: ["email"] },
    { title: "Ücret ve kayıt", keys: ["price", "formDate"] },
  ],
  contact: [
    { title: "İletişim", keys: ["phone", "email", "city"] },
    { title: "Randevu", keys: ["appointmentDate", "level", "applicationType"] },
    { title: "Kayıt", keys: ["formDate"] },
  ],
  quote: [
    { title: "Program", keys: ["program", "level", "numberOfMonths"] },
    { title: "İletişim", keys: ["email"] },
    { title: "Koşullar", keys: ["visaRequirement", "accommodation"] },
    { title: "Ücret ve kayıt", keys: ["price", "formDate"] },
  ],
};

export type KanbanCardFieldSection = { title: string; rows: { label: string; value: string }[] };

/** Kartta «form tarihi» (formData.formDate) zaten önizlemede yer alıyorsa ayrıca kayıt tarihi gösterme */
export function kanbanCardDisplaysFormDate(lead: Lead): boolean {
  const keys = CARD_PREVIEW_KEYS[lead.formType];
  if (!keys.includes("formDate")) return false;
  const raw = lead.formData.formDate;
  if (raw === undefined || raw === null) return false;
  return String(raw).trim() !== "";
}

export function getKanbanCardFieldSections(lead: Lead): KanbanCardFieldSection[] {
  const allowed = new Set(CARD_PREVIEW_KEYS[lead.formType]);
  const sections = KANBAN_CARD_SECTIONS[lead.formType];
  const out: KanbanCardFieldSection[] = [];
  for (const sec of sections) {
    const rows: { label: string; value: string }[] = [];
    for (const key of sec.keys) {
      if (!allowed.has(key)) continue;
      const raw = lead.formData[key];
      if (raw === undefined || raw === null) continue;
      const s = String(raw).trim();
      if (!s) continue;
      rows.push({ label: FIELD_LABEL_TR[key] ?? key, value: s });
    }
    if (rows.length > 0) out.push({ title: sec.title, rows });
  }
  return out;
}

/** Detay sayfası: şemadaki tüm satırlar; değer yoksa "—" */
export function getDetailFormRows(lead: Lead): { label: string; value: string; key: string }[] {
  const keys = DETAIL_FIELD_KEYS[lead.formType];
  return keys.map((key) => {
    const raw = lead.formData[key];
    let value = "—";
    if (raw !== undefined && raw !== null) {
      const s = String(raw).trim();
      if (s) value = s;
    }
    return {
      key,
      label: FIELD_LABEL_TR[key] ?? key,
      value,
    };
  });
}

export type DetailFormCategory = {
  id: string;
  title: string;
  keys: readonly string[];
};

/** Form tipine göre okunabilir gruplar (grid yerine bölüm başlıkları) */
export const DETAIL_FORM_CATEGORIES: Record<LeadFormType, readonly DetailFormCategory[]> = {
  booking: [
    { id: "kisi", title: "Kişi ve iletişim", keys: ["firstName", "lastName", "email"] },
    {
      id: "program",
      title: "Program ve tarih",
      keys: ["program", "programType", "selectedProgram", "bundle", "startDate", "courseWeeks", "preferredTime"],
    },
    {
      id: "vizeKonaklama",
      title: "Vize, konaklama ve transfer",
      keys: ["visaRequirement", "accommodationRequirement", "airportTransferPackage"],
    },
    {
      id: "kimlik",
      title: "Kimlik bilgileri",
      keys: ["placeOfBirth", "dateOfBirth", "passportNumber", "nationality"],
    },
    { id: "adres", title: "Adres", keys: ["address", "postalCode", "city", "country"] },
    { id: "mesajKaynak", title: "Mesaj, fiyat ve kaynak", keys: ["message", "price", "sourcePage", "formDate"] },
  ],
  contact: [
    { id: "kisi", title: "Kişi ve iletişim", keys: ["firstName", "phone", "email", "city"] },
    {
      id: "randevu",
      title: "Randevu ve başvuru",
      keys: ["appointmentDate", "level", "applicationType", "experienceDuration"],
    },
    { id: "egitim", title: "Eğitim ve dil", keys: ["educationInformation", "languagesKnown", "siteLanguage"] },
    { id: "mesaj", title: "Mesaj ve kaynak", keys: ["sourcePage", "message", "formDate"] },
  ],
  quote: [
    { id: "kisi", title: "Kişi ve iletişim", keys: ["firstName", "phone", "email"] },
    { id: "program", title: "Program", keys: ["program", "level", "numberOfMonths"] },
    { id: "kosullar", title: "Vize, konaklama ve transfer", keys: ["visaRequirement", "accommodation", "airportPickup"] },
    { id: "ticari", title: "Fiyat ve kaynak", keys: ["price", "formDate", "sourcePage"] },
  ],
};

export type CategorizedDetailRow = {
  categoryId: string;
  categoryTitle: string;
  key: string;
  label: string;
  value: string;
};

/** Kategorilere bölünmüş detay satırları (aynı değer mantığı) */
export function getCategorizedDetailFormRows(lead: Lead): CategorizedDetailRow[] {
  const categories = DETAIL_FORM_CATEGORIES[lead.formType];
  const rows: CategorizedDetailRow[] = [];
  for (const cat of categories) {
    for (const key of cat.keys) {
      const raw = lead.formData[key];
      let value = "—";
      if (raw !== undefined && raw !== null) {
        const s = String(raw).trim();
        if (s) value = s;
      }
      rows.push({
        categoryId: cat.id,
        categoryTitle: cat.title,
        key,
        label: FIELD_LABEL_TR[key] ?? key,
        value,
      });
    }
  }
  return rows;
}
