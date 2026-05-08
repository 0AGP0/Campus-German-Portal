import { PDFDocument, StandardFonts } from "pdf-lib";
import type { Lead } from "@/data/leads";
import { parseEuroToNumber } from "@/lib/coursePricing";
import { resolveCourseReservationTemplateBuffer } from "@/lib/resolveCourseReservationTemplate";

export type CourseReservationDraft = {
  name: string;
  residence: string;
  courseLevel: string;
  courseStart: string;
  courseFormat: string;
  courseWeek: string;
  courseFee: string;
  extraFee: string;
  totalAmount: string;
  amountDue: string;
  paymentMethod: "full" | "partial";
  onboarding: boolean;
  housing: boolean;
  welcomePackage: boolean;
  visaRefund: boolean;
  speakClub: boolean;
};

const COURSE_START_OPTIONS = [
  "04-05-2026",
  "01-06-2026",
  "06-07-2026",
  "03-08-2026",
  "07-09-2026",
  "05-10-2026",
  "02-11-2026",
  "07-12-2026",
] as const;

const COURSE_FORMAT_OPTIONS = [
  "Hybrid (16h/w)",
  "Hybrid (20h/w)",
  "Hybrid (25h/w)",
  "In-Person (16h/w)",
  "In-Person (20h/w)",
  "In-Person (25h/w)",
  "Online (16h/w)",
  "Online (20h/w)",
  "Online (25h/w)",
] as const;

function pick(fd: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = fd[k]?.trim();
    if (v) return v;
  }
  return "";
}

function numStr(raw: string, fallback = "0"): string {
  const n = parseEuroToNumber(raw);
  if (n === null) return fallback;
  return n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function isYes(v: string): boolean {
  const t = v.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes" || t === "on" || t === "evet" || t === "ja";
}

function normalizeCourseLevel(raw: string): string {
  const t = raw.trim().toUpperCase();
  if (!t) return "B1, B2";
  if (t.includes("C1")) return "C1";
  if (t.includes("B2")) return "B2";
  if (t.includes("B1")) return "B1";
  if (t.includes("A2")) return "A2";
  if (t.includes("A1")) return "A1";
  return "B1, B2";
}

/** PDF şablonundaki tarihler DD-MM-YYYY */
function optionMonthYear(opt: string): { month: number; year: number } {
  const month = Number.parseInt(opt.slice(3, 5), 10);
  const year = Number.parseInt(opt.slice(6, 10), 10);
  return { month, year };
}

function matchCourseStartOption(month: number, year?: number): string {
  const y = year ?? 2026;
  const sameMonth = COURSE_START_OPTIONS.filter((x) => optionMonthYear(x).month === month);
  if (sameMonth.length === 0) {
    const anchor = Date.UTC(y, month - 1, 1);
    let best: (typeof COURSE_START_OPTIONS)[number] = COURSE_START_OPTIONS[0];
    let bestDiff = Infinity;
    for (const opt of COURSE_START_OPTIONS) {
      const t = optionAsUtcMs(opt);
      const diff = Math.abs(t - anchor);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = opt;
      }
    }
    return best;
  }
  if (year !== undefined && !Number.isNaN(year)) {
    const byYear = sameMonth.find((x) => optionMonthYear(x).year === year);
    if (byYear) return byYear;
  }
  return sameMonth[0] ?? COURSE_START_OPTIONS[1];
}

function optionAsUtcMs(opt: string): number {
  const day = Number.parseInt(opt.slice(0, 2), 10);
  const month = Number.parseInt(opt.slice(3, 5), 10) - 1;
  const year = Number.parseInt(opt.slice(6, 10), 10);
  return Date.UTC(year, month, day);
}

const DE_MONTHS: Record<string, number> = {
  januar: 1,
  februar: 2,
  märz: 3,
  marz: 3,
  april: 4,
  mai: 5,
  juni: 6,
  juli: 7,
  august: 8,
  september: 9,
  oktober: 10,
  november: 11,
  dezember: 12,
};

function parseGermanDateLabel(label: string): { month: number; year: number } | null {
  const t = label.trim().toLowerCase();
  const dmYWord = /^(\d{1,2})\.\s*([a-zäöü]+)\s*(\d{4})/i.exec(t);
  if (dmYWord) {
    const monKey = dmYWord[2].toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    const m = DE_MONTHS[monKey];
    const y = Number(dmYWord[3]);
    if (m && y) return { month: m, year: y };
  }
  const dmy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\b/.exec(t);
  if (dmy) {
    return { month: Number(dmy[2]), year: Number(dmy[3]) };
  }
  return null;
}

/** `2026-03-02` veya `2026-03-02T…` öneki — Course start için birincil kaynak */
function matchCourseStartFromIsoDateString(raw: string): string | null {
  const t = raw.trim();
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (!parts) return null;
  const y = Number(parts[1]);
  const mo = Number(parts[2]);
  if (mo < 1 || mo > 12 || Number.isNaN(y)) return null;
  return matchCourseStartOption(mo, y);
}

/** Tek alandan (eski akış): tam seçenek, ay numarası 1–12 veya parse edilebilir tarih */
function normalizeCourseStartLegacy(raw: string): string {
  const t = raw.trim();
  if (!t) return COURSE_START_OPTIONS[1];
  if (COURSE_START_OPTIONS.includes(t as (typeof COURSE_START_OPTIONS)[number])) return t;
  const isoParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (isoParts) {
    return matchCourseStartOption(Number(isoParts[2]), Number(isoParts[1]));
  }
  const monthNum = Number.parseInt(t, 10);
  if (!Number.isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
    return matchCourseStartOption(monthNum);
  }
  const parsed = Date.parse(t);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return matchCourseStartOption(d.getMonth() + 1, d.getFullYear());
  }
  return COURSE_START_OPTIONS[1];
}

/**
 * Kurs başlangıcı (PDF dropdown).
 * Öncelik: CRM’deki «Başlangıç tarihi (ISO)» ve «Başlangıç tarihi (değer)» — `YYYY-MM-DD`.
 * Bunlar yoksa etiket / ay alanı / eski tek alan.
 */
function resolveCourseStartFromFormData(fd: Record<string, string>): string {
  for (const key of ["startDateIso", "startDateValue"] as const) {
    const hit = matchCourseStartFromIsoDateString(fd[key] ?? "");
    if (hit) return hit;
  }

  const label = pick(fd, "startDateLabel").trim();
  if (label) {
    const g = parseGermanDateLabel(label);
    if (g) return matchCourseStartOption(g.month, g.year);
    const parsed = Date.parse(label);
    if (!Number.isNaN(parsed)) {
      const d = new Date(parsed);
      return matchCourseStartOption(d.getUTCMonth() + 1, d.getUTCFullYear());
    }
  }

  const monthLabel = pick(fd, "startMonthLabel", "quoteMonthStart").trim();
  const monthFromLabel = Number.parseInt(monthLabel, 10);
  if (!Number.isNaN(monthFromLabel) && monthFromLabel >= 1 && monthFromLabel <= 12) {
    return matchCourseStartOption(monthFromLabel);
  }

  return normalizeCourseStartLegacy(pick(fd, "startDateValue", "startDate"));
}

function normalizeCourseWeek(raw: string): string {
  const n = Number.parseInt(raw.trim(), 10);
  const weeks = Number.isNaN(n) ? 8 : n;
  const allowed = [4, 6, 8, 12, 16, 20, 24, 32, 40];
  let closest = allowed[0];
  for (const a of allowed) {
    if (Math.abs(a - weeks) < Math.abs(closest - weeks)) closest = a;
  }
  return `${closest} Week`;
}

function normalizeCourseFormat(rawProgram: string, rawIntensity: string): string {
  const p = rawProgram.toLowerCase();
  const i = rawIntensity.toLowerCase();
  const mode = p.includes("online") ? "Online" : p.includes("hybrid") ? "Hybrid" : "In-Person";
  const hours = i.includes("25") ? "25h/w" : i.includes("16") ? "16h/w" : "20h/w";
  const out = `${mode} (${hours})`;
  return COURSE_FORMAT_OPTIONS.includes(out as (typeof COURSE_FORMAT_OPTIONS)[number]) ? out : "In-Person (20h/w)";
}

export function buildCourseReservationDraft(lead: Lead): CourseReservationDraft {
  const fd = lead.formData;
  const price = pick(fd, "price", "totalPrice");
  const courseFee = numStr(price, "0");
  const extraFee = "0";
  const total = numStr(price, "0");

  return {
    name: [pick(fd, "firstName", "first_name", "name"), pick(fd, "lastName", "last_name")]
      .filter(Boolean)
      .join(" ")
      .trim() || lead.name,
    residence: [pick(fd, "city"), pick(fd, "country"), pick(fd, "nationality")]
      .filter(Boolean)
      .join(", "),
    courseLevel: normalizeCourseLevel(pick(fd, "level", "quoteLevelStart", "selectedProgram")),
    courseStart: resolveCourseStartFromFormData(fd),
    courseFormat: normalizeCourseFormat(pick(fd, "program", "quoteProgramLabel"), pick(fd, "intensiveType", "programType")),
    courseWeek: normalizeCourseWeek(pick(fd, "weeks", "courseWeeks", "numberOfMonths")),
    courseFee,
    extraFee,
    totalAmount: total,
    amountDue: total,
    paymentMethod: "full",
    onboarding: isYes(pick(fd, "onboarding")),
    housing: isYes(pick(fd, "accommodation", "accommodationRequirement")),
    welcomePackage: isYes(pick(fd, "welcomePackage")),
    visaRefund: isYes(pick(fd, "visaRequirement")),
    speakClub: isYes(pick(fd, "speakClub")),
  };
}

export function normalizeCourseReservationDraft(raw: unknown, lead: Lead): CourseReservationDraft {
  const base = buildCourseReservationDraft(lead);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const r = raw as Record<string, unknown>;
  const str = (k: keyof CourseReservationDraft): string =>
    typeof r[k] === "string" ? (r[k] as string).trim() : (base[k] as string);
  const bool = (k: keyof CourseReservationDraft): boolean =>
    typeof r[k] === "boolean" ? (r[k] as boolean) : (base[k] as boolean);
  const paymentMethod =
    r.paymentMethod === "partial" || r.paymentMethod === "full"
      ? (r.paymentMethod as "full" | "partial")
      : base.paymentMethod;
  return {
    name: str("name"),
    residence: str("residence"),
    courseLevel: str("courseLevel"),
    courseStart: str("courseStart"),
    courseFormat: str("courseFormat"),
    courseWeek: str("courseWeek"),
    courseFee: str("courseFee"),
    extraFee: str("extraFee"),
    totalAmount: str("totalAmount"),
    amountDue: str("amountDue"),
    paymentMethod,
    onboarding: bool("onboarding"),
    housing: bool("housing"),
    welcomePackage: bool("welcomePackage"),
    visaRefund: bool("visaRefund"),
    speakClub: bool("speakClub"),
  };
}

function safeSetText(form: ReturnType<PDFDocument["getForm"]>, field: string, value: string) {
  try {
    form.getTextField(field).setText(value || "");
  } catch {
    /* field not found in template */
  }
}

function safeSetChoice(form: ReturnType<PDFDocument["getForm"]>, field: string, value: string) {
  try {
    form.getDropdown(field).select(value);
  } catch {
    /* field not found or invalid option */
  }
}

function safeSetCheck(form: ReturnType<PDFDocument["getForm"]>, field: string, on: boolean) {
  try {
    const cb = form.getCheckBox(field);
    if (on) cb.check();
    else cb.uncheck();
  } catch {
    /* field not found */
  }
}

function safeSetRadio(
  form: ReturnType<PDFDocument["getForm"]>,
  field: string,
  method: "full" | "partial",
) {
  try {
    const group = form.getRadioGroup(field);
    const preferred = method === "partial" ? "Partialpayment" : "Fullpayment";
    try {
      group.select(preferred);
    } catch {
      group.select(`/${preferred}`);
    }
  } catch {
    /* field not found */
  }
}

function refreshTextAndDropdownAppearancesOnly(
  form: ReturnType<PDFDocument["getForm"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
) {
  const textFields = ["Name", "Residence", "Coursefee", "Extrafee", "Totalamount", "Amountdue"] as const;
  for (const name of textFields) {
    try {
      form.getTextField(name).defaultUpdateAppearances(font);
    } catch {
      /* ignore missing */
    }
  }
  const dropdowns = ["Courselevel", "Coursestart", "Courseformat", "Courseweek"] as const;
  for (const name of dropdowns) {
    try {
      form.getDropdown(name).defaultUpdateAppearances(font);
    } catch {
      /* ignore missing */
    }
  }
}

export async function generateCourseReservationPdf(
  draft: CourseReservationDraft,
  flatten = false,
): Promise<Buffer> {
  const tpl = await resolveCourseReservationTemplateBuffer();
  if (!tpl) {
    throw new Error(
      "Course Reservation şablonu bulunamadı. COURSE_RESERVATION_TEMPLATE_PATH veya public/templates/course-reservation.pdf kullanın.",
    );
  }
  const pdf = await PDFDocument.load(tpl);
  const form = pdf.getForm();
  safeSetText(form, "Name", draft.name);
  safeSetText(form, "Residence", draft.residence);
  safeSetChoice(form, "Courselevel", draft.courseLevel);
  safeSetChoice(form, "Coursestart", draft.courseStart);
  safeSetChoice(form, "Courseformat", draft.courseFormat);
  safeSetChoice(form, "Courseweek", draft.courseWeek);
  safeSetText(form, "Coursefee", draft.courseFee);
  safeSetText(form, "Extrafee", draft.extraFee);
  safeSetText(form, "Totalamount", draft.totalAmount);
  safeSetText(form, "Amountdue", draft.amountDue);
  safeSetRadio(form, "Payment", draft.paymentMethod);
  safeSetCheck(form, "Onboarding", draft.onboarding);
  safeSetCheck(form, "Housing", draft.housing);
  safeSetCheck(form, "Welcomepackage", draft.welcomePackage);
  safeSetCheck(form, "Visarefund", draft.visaRefund);
  safeSetCheck(form, "Speakclub", draft.speakClub);
  // Kritik: Checkbox/Radio appearance'ını default generator ile yenilemeyiz.
  // Yenilersek template'deki tik görünümü yerine kare çerçeve oluşuyor.
  const uiFont = await pdf.embedFont(StandardFonts.Helvetica);
  refreshTextAndDropdownAppearancesOnly(form, uiFont);
  /**
   * Bazı PDF görüntüleyicilerde (özellikle iframe önizleme) alanlar bozuk/eksik
   * görünebiliyor. Appearance stream'leri yeniden üretmek bunu stabilize eder.
   */
  // form.updateFieldAppearances() checkbox/radio görünümünü de override eder, istemiyoruz.
  if (flatten) form.flatten();
  const bytes = await pdf.save({ updateFieldAppearances: false });
  return Buffer.from(bytes);
}
