import { PDFDocument, StandardFonts, type PDFFont, rgb } from "pdf-lib";
import { getOfficialBookingLines } from "@/lib/bookingOfficialDocumentLines";
import { buildBookingOfficialPlaceholders } from "@/lib/bookingOfficialPdf";
import type { Lead } from "@/data/leads";

const MM_TO_PT = 2.83465;

/** jsPDF ile aynı — Helvetica umlaut */
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

function wrapToLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
    else {
      if (line) out.push(line);
      line = w;
    }
  }
  if (line) out.push(line);
  return out;
}

/**
 * Vorlage PDF sayfalarını kopyalar, üzerine resmi metni (jsPDF ile aynı içerik) çizer.
 * Word’den gelen şablonda zaten aynı paragraflar yazılıysa çift metin görünebilir;
 * ideal: şablonda yalnızca logo/antet veya boş alan, metin CRM’den.
 */
export async function renderOfficialTextOnVorlageTemplate(
  vorlageBytes: Uint8Array,
  lead: Lead,
): Promise<ArrayBuffer> {
  const m = buildBookingOfficialPlaceholders(lead);

  const src = await PDFDocument.load(vorlageBytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);

  const copied = await out.copyPages(src, src.getPageIndices());
  copied.forEach((p) => out.addPage(p));

  const linePages = getOfficialBookingLines(m);
  const needed = linePages.length;
  const first = out.getPage(0);
  const { width: pw, height: ph } = first.getSize();
  while (out.getPageCount() < needed) {
    out.addPage([pw, ph]);
  }

  const fontSize = 9;
  const margin = 18 * MM_TO_PT;
  const lh = 5 * MM_TO_PT;

  for (let i = 0; i < needed; i++) {
    const page = out.getPage(i);
    const { height, width } = page.getSize();
    const lines = linePages[i] ?? [];
    let y = height - margin;

    for (const raw of lines) {
      const text = deAscii(raw);
      if (text === "") {
        y -= lh * 0.55;
        continue;
      }
      const maxW = width - 2 * margin;
      const sublines = wrapToLines(text, font, fontSize, maxW);
      for (const sub of sublines) {
        if (y < margin + lh) break;
        page.drawText(sub, {
          x: margin,
          y: y - fontSize,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        y -= lh;
      }
    }
  }

  const u8 = await out.save({ useObjectStreams: false });
  const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  return ab as ArrayBuffer;
}
