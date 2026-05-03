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
    "courseTitle",
    "level",
    "numberOfMonths",
    "email",
    "price",
    "formDate",
  ],
  "private-documents-form": [
    "first_name",
    "last_name",
    "email",
    "passport_no",
    "city",
    "country",
    "phone",
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
    "programCode",
    "level",
    "numberOfMonths",
    "startMonthLabel",
    "startDateValue",
    "weeks",
    "intensiveType",
    "courseTitle",
    "courseId",
    "freeLesson",
    "courseSelection",
    "message",
    "country",
    "visaRequirement",
    "accommodation",
    "airportPickup",
    "price",
    "formDate",
    "sourcePage",
    "siteLanguage",
  ],
  "private-documents-form": [
    "first_name",
    "last_name",
    "email",
    "phone",
    "birth_date",
    "nationality",
    "birth_place",
    "passport_no",
    "city",
    "country",
    "message",
    "sourcePage",
    "lang",
    "passport_copy_path",
    "digital_signature_path",
    "terms_accepted",
    "privacy_accepted",
    "formDate",
  ],
};

export const FORM_TYPE_LABEL_TR: Record<LeadFormType, string> = {
  booking: "Booking",
  contact: "İletişim formu",
  quote: "Teklif formu",
  "private-documents-form": "Özel evrak formu",
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
  programCode: "Program kodu",
  startMonthLabel: "Başlangıç ayı",
  startDateValue: "Başlangıç tarihi (değer)",
  weeks: "Hafta",
  intensiveType: "Yoğunluk / tip",
  courseTitle: "Kurs başlığı",
  courseId: "Kurs ID",
  freeLesson: "Ücretsiz ders",
  courseSelection: "Kurs seçimi",
  first_name: "Ad",
  last_name: "Soyad",
  birth_date: "Doğum tarihi",
  birth_place: "Doğum yeri",
  passport_no: "Pasaport no",
  passport_copy_path: "Pasaport dosyası (yol)",
  digital_signature_path: "Dijital imza (yol)",
  terms_accepted: "Şartlar kabul",
  privacy_accepted: "Gizlilik politikası kabul",
  lang: "Form dili",
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
    { title: "Program", keys: ["program", "courseTitle", "level", "numberOfMonths"] },
    { title: "İletişim", keys: ["email"] },
    { title: "Ücret ve kayıt", keys: ["price", "formDate"] },
  ],
  "private-documents-form": [
    { title: "Kişi", keys: ["first_name", "last_name", "email", "phone"] },
    { title: "Kimlik", keys: ["birth_date", "birth_place", "nationality", "passport_no"] },
    { title: "Adres", keys: ["city", "country"] },
    { title: "Mesaj ve kaynak", keys: ["message", "sourcePage", "lang", "formDate"] },
    { title: "Dosyalar ve onay", keys: ["passport_copy_path", "digital_signature_path", "terms_accepted", "privacy_accepted"] },
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
    {
      id: "program",
      title: "Program ve kurs",
      keys: [
        "program",
        "programCode",
        "courseTitle",
        "level",
        "numberOfMonths",
        "startMonthLabel",
        "startDateValue",
        "weeks",
        "intensiveType",
        "courseSelection",
        "courseId",
        "freeLesson",
      ],
    },
    { id: "konum", title: "Konum", keys: ["country"] },
    {
      id: "kosullar",
      title: "Vize, konaklama (eski / isteğe bağlı)",
      keys: ["visaRequirement", "accommodation", "airportPickup"],
    },
    { id: "mesaj", title: "Mesaj", keys: ["message"] },
    {
      id: "ticari",
      title: "Fiyat ve kaynak",
      keys: ["price", "formDate", "sourcePage", "siteLanguage"],
    },
  ],
  "private-documents-form": [
    { id: "kisi", title: "Kişi ve iletişim", keys: ["first_name", "last_name", "email", "phone"] },
    { id: "kimlik", title: "Kimlik bilgileri", keys: ["birth_date", "birth_place", "nationality", "passport_no"] },
    { id: "adres", title: "Konum", keys: ["city", "country"] },
    { id: "mesaj", title: "Mesaj ve kaynak", keys: ["message", "sourcePage", "lang", "formDate"] },
    {
      id: "dosya",
      title: "Dosyalar ve onay",
      keys: ["passport_copy_path", "digital_signature_path", "terms_accepted", "privacy_accepted"],
    },
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
