import { chromium } from "playwright";
import type { Lead } from "@/data/leads";
import { buildBookingOfficialHtmlDocument } from "@/lib/bookingOfficialHtmlTemplate";
import { generateBookingOfficialPdf } from "@/lib/bookingOfficialPdf";

/**
 * HTML/CSS şablon → PDF (Playwright Chromium).
 * Playwright yoksa veya hata olursa jsPDF yedeğe düşer.
 */
export async function generateBookingOfficialHtmlPdf(lead: Lead): Promise<ArrayBuffer> {
  try {
    const html = await buildBookingOfficialHtmlDocument(lead);
    const buf = await renderHtmlToPdfBuffer(html);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch (e) {
    console.error("bookingOfficialHtmlPdf:", e);
    return generateBookingOfficialPdf(lead);
  }
}

async function renderHtmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 60_000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
