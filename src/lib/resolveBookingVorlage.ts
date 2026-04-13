import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Şablon PDF baytlarını bulur.
 * 1) BOOKING_VORLAGE_PATH (mutlak veya göreli)
 * 2) public/templates/booking-official-vorlage.pdf
 * 3) Proje kökünde adında "vorlage" ve ".pdf" geçen ilk dosya (ör. Vorlage für … .pdf)
 * 4) Vorlage für Ofizielle Dokumente.docx.pdf (sabit ad)
 */
export async function resolveBookingVorlageBuffer(): Promise<Buffer | null> {
  const envPath = process.env.BOOKING_VORLAGE_PATH?.trim();
  if (envPath) {
    try {
      const b = await readFile(envPath);
      if (b.length) return b;
    } catch {
      /* devam */
    }
  }

  const standard = join(process.cwd(), "public", "templates", "booking-official-vorlage.pdf");
  try {
    const b = await readFile(standard);
    if (b.length) return b;
  } catch {
    /* devam */
  }

  try {
    const files = await readdir(process.cwd());
    const hit = files.find((f) => /\.pdf$/i.test(f) && /vorlage/i.test(f));
    if (hit) {
      const b = await readFile(join(process.cwd(), hit));
      if (b.length) return b;
    }
  } catch {
    /* devam */
  }

  const legacy = join(process.cwd(), "Vorlage für Ofizielle Dokumente.docx.pdf");
  try {
    const b = await readFile(legacy);
    if (b.length) return b;
  } catch {
    /* yok */
  }

  return null;
}
