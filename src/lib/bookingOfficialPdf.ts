import { jsPDF } from "jspdf";
import type { Lead } from "@/data/leads";
import { getOfficialBookingLines } from "@/lib/bookingOfficialDocumentLines";
import type { BookingDocPlaceholders } from "@/lib/bookingOfficialTypes";
import {
  formatEurDe,
  parseCourseWeeks,
  parseEuroToNumber,
  totalCoursePriceEur,
  weeklyRateEur,
} from "@/lib/coursePricing";

export type { BookingDocPlaceholders } from "@/lib/bookingOfficialTypes";

/** Almanca karakterleri jsPDF varsayılan fontunda güvenli ASCII'ye çevirir */
function deAscii(s: string): string {
  return s
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");
}

function pick(fd: Record<string, string>, key: string, fb = "—"): string {
  const v = fd[key]?.trim();
  return v || fb;
}

function parseDateFlexible(input: string | undefined): Date | null {
  if (!input?.trim()) return null;
  const t = input.trim();
  const ts = Date.parse(t);
  if (!Number.isNaN(ts)) return new Date(ts);
  const dm = /^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/.exec(t);
  if (dm) {
    const d = Number(dm[1]);
    const mo = Number(dm[2]) - 1;
    let y = Number(dm[3]);
    if (dm[3].length === 2) y += y < 70 ? 2000 : 1900;
    const dt = new Date(y, mo, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

function formatDE(d: Date | null): string {
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE");
}

function addWeeks(d: Date, weeks: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + weeks * 7);
  return x;
}

/** Ja/Nein — form metnine göre (booking: visaRequirement, accommodationRequirement, airportTransferPackage) */
function jaNein(raw: string | undefined): string {
  if (!raw?.trim()) return "Nein";
  const t = raw.toLowerCase();
  if (t.includes("nein") || t.includes("no") || t.includes("hayir") || t.includes("yok")) return "Nein";
  if (t.includes("ja") || t.includes("yes") || t.includes("evet") || t.includes("visa") || t.includes("vize"))
    return "Ja";
  return "Nein";
}

/**
 * Booking lead alanlarını PDF şablonundaki (snake_case) yer tutuculara çevirir.
 * Eksik alanlar "—" veya mantıklı varsayılan.
 */
export function buildBookingOfficialPlaceholders(lead: Lead): BookingDocPlaceholders {
  const fd = lead.formData;
  const firstName = pick(fd, "firstName", "");
  const lastName = pick(fd, "lastName", "");
  const docDate = new Date().toLocaleDateString("de-DE");

  const courseTotalWeeks = parseCourseWeeks(fd);
  const start = parseDateFlexible(fd.startDate);
  const courseEnd = start ? addWeeks(start, courseTotalWeeks) : null;

  const tierWeekRate = weeklyRateEur(courseTotalWeeks);
  const computedTotalEur = totalCoursePriceEur(courseTotalWeeks);
  const priceFromForm = parseEuroToNumber(fd.price);
  /** Öncelik: booking formundan gelen fiyat; yoksa dilim tablosundan hesap */
  const grandAmountEur = priceFromForm ?? computedTotalEur;
  const grandStr = formatEurDe(grandAmountEur);
  const weekPriceStr = formatEurDe(tierWeekRate);

  const courseLevel = [pick(fd, "selectedProgram"), pick(fd, "program"), pick(fd, "programType")]
    .filter((x) => x !== "—")
    .join(" · ");

  const offerNo = lead.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 14).toUpperCase() || "OFFER";

  return {
    first_name: firstName || "—",
    last_name: lastName || "—",
    doc_date: docDate,
    address_line: pick(fd, "address"),
    postal_code: pick(fd, "postalCode"),
    adress_city: pick(fd, "city"),
    adress_country: pick(fd, "country"),
    birth_date: pick(fd, "dateOfBirth"),
    birth_place: pick(fd, "placeOfBirth"),
    nationality: pick(fd, "nationality"),
    course_level: courseLevel || "—",
    course_start: formatDE(start),
    course_end: formatDE(courseEnd),
    course_total: String(courseTotalWeeks),
    weekly_hours: "20",
    course_mode: "Präsenz",
    grand_total: grandStr,
    amount_paid: "0,00",
    amount_due: grandStr,
    passport_no: pick(fd, "passportNumber"),
    city: pick(fd, "city"),
    country: pick(fd, "country"),
    offer_no: offerNo,
    week_price: weekPriceStr,
    course_price: grandStr,
    UArt: "UE",
    Zahlungsart: "Überweisung",
    payment_amount: grandStr,
    offer_no_: offerNo,
    visa_inv: jaNein(fd.visaRequirement),
    bre_onb: jaNein(fd.airportTransferPackage),
    unterkunft: jaNein(fd.accommodationRequirement),
    kurs_mat: "Nein",
  };
}

function addWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  yStart: number,
  maxW: number,
  lineMm: number,
): number {
  const t = deAscii(text);
  const lines = doc.splitTextToSize(t, maxW);
  const pageH = doc.internal.pageSize.getHeight();
  let y = yStart;
  for (const ln of lines) {
    if (y > pageH - 12) {
      doc.addPage();
      y = 20;
    }
    doc.text(ln, x, y);
    y += lineMm;
  }
  return y + 2;
}

/**
 * Resmi döküman seti (4 sayfa) — Vorlage PDF ile aynı içerik akışı, booking formData ile doldurulur.
 */
export function generateBookingOfficialPdf(lead: Lead): ArrayBuffer {
  if (lead.formType !== "booking") {
    throw new Error("Belge uretimi yalnizca booking leadleri icin");
  }
  const m = buildBookingOfficialPlaceholders(lead);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  const maxW = doc.internal.pageSize.getWidth() - 2 * margin;
  const lh = 5;

  doc.setFontSize(9);

  const pages = getOfficialBookingLines(m);
  let first = true;
  for (const pageLines of pages) {
    if (!first) doc.addPage();
    first = false;
    let y = 18;
    const line = (s: string) => {
      y = addWrapped(doc, s, margin, y, maxW, lh);
    };
    for (const s of pageLines) line(s);
  }

  return doc.output("arraybuffer") as ArrayBuffer;
}
