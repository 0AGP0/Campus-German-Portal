import { PDFCheckBox, PDFDocument, PDFTextField, type PDFField } from "pdf-lib";
import type { Lead } from "@/data/leads";
import { buildBookingOfficialPlaceholders, generateBookingOfficialPdf } from "@/lib/bookingOfficialPdf";
import type { BookingDocPlaceholders } from "@/lib/bookingOfficialTypes";
import { renderOfficialTextOnVorlageTemplate } from "@/lib/bookingOfficialVorlageRender";
import { resolveBookingVorlageBuffer } from "@/lib/resolveBookingVorlage";

/**
 * 1) AcroForm alanları varsa pdf-lib ile doldur (Vorlage görünümü + veri).
 * 2) Yoksa veya BOOKING_VORLAGE_DISABLE_OVERLAY ayarlı değilse: Vorlage sayfalarını kopyalayıp üstüne aynı metni çizer.
 *    Word’de aynı metin zaten basılıysa çift satır görünebilir; şablonda yalnızca logo/üstbilgi bırakın veya Acrobat’ta form kullanın.
 * 3) Şablon yoksa: jsPDF.
 *
 * Şablon arama: resolveBookingVorlage.ts — BOOKING_VORLAGE_PATH, public/templates/…, kökte *vorlage*.pdf
 */

function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const ALIASES: Record<string, keyof BookingDocPlaceholders> = {
  first_name: "first_name",
  firstname: "first_name",
  vorname: "first_name",
  last_name: "last_name",
  lastname: "last_name",
  nachname: "last_name",
  doc_date: "doc_date",
  datum: "doc_date",
  date: "doc_date",
  address_line: "address_line",
  adresse: "address_line",
  strasse: "address_line",
  postal_code: "postal_code",
  plz: "postal_code",
  adress_city: "adress_city",
  ort: "adress_city",
  stadt: "adress_city",
  adress_country: "adress_country",
  land: "adress_country",
  birth_date: "birth_date",
  geburtsdatum: "birth_date",
  birth_place: "birth_place",
  geburtsort: "birth_place",
  nationality: "nationality",
  staatsangehoerigkeit: "nationality",
  course_level: "course_level",
  kursstufe: "course_level",
  course_start: "course_start",
  course_end: "course_end",
  course_total: "course_total",
  weekly_hours: "weekly_hours",
  course_mode: "course_mode",
  grand_total: "grand_total",
  gesamtbetrag: "grand_total",
  amount_paid: "amount_paid",
  amount_due: "amount_due",
  passport_no: "passport_no",
  passnummer: "passport_no",
  city: "city",
  country: "country",
  offer_no: "offer_no",
  angebotsnummer: "offer_no",
  week_price: "week_price",
  course_price: "course_price",
  payment_amount: "payment_amount",
  offer_no_: "offer_no_",
  visa_inv: "visa_inv",
  bre_onb: "bre_onb",
  unterkunft: "unterkunft",
  kurs_mat: "kurs_mat",
  uart: "UArt",
  u_art: "UArt",
  zahlungsart: "Zahlungsart",
};

function resolveKey(fieldName: string): keyof BookingDocPlaceholders | undefined {
  const n = normalizeFieldName(fieldName);
  if (ALIASES[n]) return ALIASES[n];
  const placeholderKeys: (keyof BookingDocPlaceholders)[] = [
    "first_name",
    "last_name",
    "doc_date",
    "address_line",
    "postal_code",
    "adress_city",
    "adress_country",
    "birth_date",
    "birth_place",
    "nationality",
    "course_level",
    "course_start",
    "course_end",
    "course_total",
    "weekly_hours",
    "course_mode",
    "grand_total",
    "amount_paid",
    "amount_due",
    "passport_no",
    "city",
    "country",
    "offer_no",
    "week_price",
    "course_price",
    "UArt",
    "Zahlungsart",
    "payment_amount",
    "offer_no_",
    "visa_inv",
    "bre_onb",
    "unterkunft",
    "kurs_mat",
  ];
  for (const k of placeholderKeys) {
    if (normalizeFieldName(k) === n) return k;
  }
  return undefined;
}

function fillField(field: PDFField, value: string): boolean {
  try {
    if (field instanceof PDFTextField) {
      field.setText(value);
      return true;
    }
    if (field instanceof PDFCheckBox) {
      const v = value.trim().toLowerCase();
      const yes = v === "ja" || v === "yes" || v === "evet";
      if (yes) field.check();
      else field.uncheck();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

async function tryFillBookingOfficialVorlageFromBuffer(
  bytes: Buffer,
  lead: Lead,
): Promise<ArrayBuffer | null> {
  if (lead.formType !== "booking") return null;

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch {
    return null;
  }

  const form = pdfDoc.getForm();
  if (form.hasXFA()) {
    try {
      form.deleteXFA();
    } catch {
      return null;
    }
  }

  const fields = form.getFields();
  if (fields.length === 0) return null;

  const m = buildBookingOfficialPlaceholders(lead);
  let filled = 0;

  for (const field of fields) {
    const key = resolveKey(field.getName());
    if (!key) continue;
    const val = String(m[key]);
    if (fillField(field, val)) filled += 1;
  }

  if (filled === 0) return null;

  try {
    form.flatten();
  } catch {
    /* ignore */
  }

  const out = await pdfDoc.save({ useObjectStreams: false });
  const ab = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
  return ab as ArrayBuffer;
}

/** Önce Vorlage (form veya şablon üstü çizim); yoksa jsPDF. */
export async function generateBookingOfficialPdfAsync(lead: Lead): Promise<ArrayBuffer> {
  const buf = await resolveBookingVorlageBuffer();
  if (buf?.length) {
    const fromForm = await tryFillBookingOfficialVorlageFromBuffer(buf, lead);
    if (fromForm) return fromForm;

    if (process.env.BOOKING_VORLAGE_DISABLE_OVERLAY !== "1") {
      return renderOfficialTextOnVorlageTemplate(new Uint8Array(buf), lead);
    }
  }

  return generateBookingOfficialPdf(lead);
}
