import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { Lead } from "@/data/leads";
import { buildBookingOfficialPlaceholders } from "@/lib/bookingOfficialPdf";
import { resolveBookingDocxBuffer } from "@/lib/resolveBookingDocx";

/**
 * Word içinde yer tutucular (docxtemplater): {first_name} {last_name} {doc_date} {address_line}
 * {postal_code} {adress_city} {adress_country} {birth_date} {birth_place} {nationality}
 * {course_level} {course_start} {course_end} {course_total} {weekly_hours} {course_mode}
 * {grand_total} {amount_paid} {amount_due} {passport_no} {city} {country} {offer_no}
 * {week_price} {course_price} {UArt} {Zahlungsart} {payment_amount} {offer_no_}
 * {visa_inv} {bre_onb} {unterkunft} {kurs_mat}
 */
export async function generateBookingOfficialDocx(lead: Lead): Promise<Buffer> {
  if (lead.formType !== "booking") {
    throw new Error("Yalnızca booking leadleri için DOCX üretilir");
  }

  const templateBuf = await resolveBookingDocxBuffer();
  if (!templateBuf?.length) {
    throw new Error(
      "DOCX şablonu bulunamadı. public/templates/booking-official-vorlage.docx ekleyin veya BOOKING_VORLAGE_DOCX_PATH kullanın.",
    );
  }

  const zip = new PizZip(templateBuf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },
    nullGetter: () => "",
  });

  const data = buildBookingOfficialPlaceholders(lead);
  doc.setData(data);
  try {
    doc.render();
  } catch (e) {
    const err = e as { properties?: { errors?: unknown[] } };
    console.error("docxtemplater render", err?.properties?.errors ?? e);
    throw new Error("Word şablonu işlenemedi. Yer tutucu sözdizimi veya şablon hatası olabilir.");
  }

  const out = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  return Buffer.from(out);
}
