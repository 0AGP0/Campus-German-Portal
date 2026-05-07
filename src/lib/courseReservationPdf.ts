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

function normalizeCourseStart(raw: string): string {
  const t = raw.trim();
  if (!t) return COURSE_START_OPTIONS[1];
  if (COURSE_START_OPTIONS.includes(t as (typeof COURSE_START_OPTIONS)[number])) return t;
  const monthNum = Number.parseInt(t, 10);
  if (!Number.isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
    const hit = COURSE_START_OPTIONS.find((x) => Number.parseInt(x.slice(3, 5), 10) === monthNum);
    if (hit) return hit;
  }
  const parsed = Date.parse(t);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const m = d.getMonth() + 1;
    const hit = COURSE_START_OPTIONS.find((x) => Number.parseInt(x.slice(3, 5), 10) === m);
    if (hit) return hit;
  }
  return COURSE_START_OPTIONS[1];
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
    residence: [pick(fd, "city"), pick(fd, "country")].filter(Boolean).join(", "),
    courseLevel: normalizeCourseLevel(pick(fd, "level", "quoteLevelStart", "selectedProgram")),
    courseStart: normalizeCourseStart(pick(fd, "startDateValue", "startDate", "startMonthLabel", "quoteMonthStart")),
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
