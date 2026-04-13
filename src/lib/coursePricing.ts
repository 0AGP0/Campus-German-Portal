/**
 * Campus German — yoğun kurs haftalık ücret dilimleri (toplam kurs süresine göre sabit haftalık fiyat).
 * Örnek: 12 hafta → 130 €/hafta → 1.560 € toplam.
 */

/** Toplam hafta sayısına göre haftalık EUR (KDV hariç net tarife). */
export function weeklyRateEur(totalWeeks: number): number {
  const w = Math.max(1, Math.floor(totalWeeks));
  if (w >= 25) return 110;
  /* 16–24 Wochen: 120 € (z. B. 16 Wochen = 1.920 €); 9–15 Wochen: 130 € (z. B. 12 = 1.560 €) */
  if (w >= 16) return 120;
  if (w >= 9) return 130;
  if (w >= 5) return 150;
  return 190;
}

/** Aynı dilimde tüm haftalar aynı birim fiyatla çarpılır. */
export function totalCoursePriceEur(weeks: number): number {
  const w = Math.max(1, Math.floor(weeks));
  return w * weeklyRateEur(w);
}

/** Formdan hafta sayısı (ileride booking alanı eklenebilir). */
export function parseCourseWeeks(formData: Record<string, string>): number {
  const keys = ["courseWeeks", "numberOfWeeks", "weeks", "totalWeeks", "kursWochen"] as const;
  for (const k of keys) {
    const raw = formData[k]?.trim();
    if (!raw) continue;
    const n = Number.parseInt(raw, 10);
    if (!Number.isNaN(n) && n > 0 && n <= 104) return n;
  }
  return 12;
}

/** "1.560" veya "1560,00" gibi metinden sayı (EUR). */
export function parseEuroToNumber(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const s = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function formatEurDe(n: number): string {
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * PDF alt bilgisi: fiyat dilimleri (şablondaki tabloyla uyumlu metin).
 */
export const PRICING_TIER_TEXT_DE: readonly string[] = [
  "Preisstaffelung (pro Woche, abhaengig von der Gesamtkursdauer):",
  "1-4 Wochen:   190 EUR/Woche   (z.B. 2 Wochen = 380 EUR)",
  "5-8 Wochen:   150 EUR/Woche   (z.B. 8 Wochen = 1.200 EUR)",
  "9-15 Wochen:  130 EUR/Woche   (z.B. 12 Wochen = 1.560 EUR)",
  "16-24 Wochen: 120 EUR/Woche   (z.B. 16 Wochen = 1.920 EUR)",
  "25+ Wochen:   110 EUR/Woche   (z.B. 25 Wochen = 2.750 EUR)",
];
