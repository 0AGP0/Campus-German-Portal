import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Lead } from "@/data/leads";
import { buildBookingOfficialPlaceholders } from "@/lib/bookingOfficialPdf";
import type { BookingDocPlaceholders } from "@/lib/bookingOfficialTypes";

/** Vorlage für Ofizielle Dokumente.docx.md ile aynı yapı ve metin (UTF-8 Almanca). */
function e(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Üst sol — Bremen iletişim (PDF header). */
function headerContactBlock(): string {
  return `<div class="header-contact">
    <span class="header-contact-line">Campus German Sprachschule,</span>
    <span class="header-contact-line">Bürgermeister Smidt Str. 80, 28195 Bremen</span>
    <span class="header-contact-line">info@campusgerman.com / 0 421 4851 7985</span>
  </div>`;
}

/** Her sayfa altı — 3 sütun (PDF footer). */
function sheetFooterBlock(): string {
  return `<footer class="sheet-footer" aria-label="Impressum">
    <div class="sheet-footer-col">
      <span class="sheet-footer-h">Firma &amp; Anschrift</span>
      <span>Campus German Sprachschule GmbH</span>
      <span>Florianstr. 15-21, 44139 Dortmund</span>
      <span>Telefon: +49 421 4851 7985</span>
      <span>E-Mail: info@campusgerman.com</span>
      <span>Web: www.campusgerman.com</span>
    </div>
    <div class="sheet-footer-col">
      <span class="sheet-footer-h">Register &amp; Geschäftsführung</span>
      <span>Sitz der Gesellschaft: Dortmund</span>
      <span>Registergericht: Amtsgericht Dortmund</span>
      <span>Handelsregister: HRB 38144</span>
      <span>Geschäftsführung: Ihsan Samil Akman</span>
    </div>
    <div class="sheet-footer-col">
      <span class="sheet-footer-h">Bank &amp; Steuern</span>
      <span>Bank: Commerzbank AG</span>
      <span>IBAN: DE75 3004 0000 0497 1263 00</span>
      <span>BIC: COBADEFFXXX</span>
      <span>USt-IdNr.: DE452312228</span>
    </div>
  </footer>`;
}

async function buildLogoBlock(): Promise<string> {
  const candidates = [
    join(process.cwd(), "public", "campus-german-official-logo.png"),
    join(process.cwd(), "public", "booking-logo.png"),
    join(process.cwd(), "public", "logo.png"),
    join(process.cwd(), "public", "campus-german-logo.png"),
  ];
  for (const p of candidates) {
    try {
      const buf = await readFile(p);
      const ext = p.toLowerCase().endsWith(".png") ? "png" : "jpeg";
      const src = `data:image/${ext};base64,${buf.toString("base64")}`;
      return `<img class="logo-img" src="${src}" alt="Campus German" />`;
    } catch {
      /* next */
    }
  }
  return `<div class="logo-fallback" aria-label="Campus German">
    <span class="logo-fallback-title">Campus German</span>
    <span class="logo-fallback-sub">Sprachschule</span>
  </div>`;
}

function cm(m: BookingDocPlaceholders): string {
  const raw = m.course_mode.trim();
  if (/praesenz|präsenz/i.test(raw)) return "Präsenz";
  return e(m.course_mode);
}

function addressBlock(m: BookingDocPlaceholders): string {
  return `<div class="address-block">
  <div class="address-block-grid">
    <div class="address-block-main">
      <p class="address-line address-salutation">An <strong>${e(m.first_name)} ${e(m.last_name)}</strong></p>
      <p class="address-line">${e(m.address_line)}</p>
      <p class="address-line">${e(m.postal_code)} ${e(m.adress_city)}</p>
      <p class="address-line">${e(m.adress_country)}</p>
    </div>
    <p class="address-datum-line"><strong>Datum: ${e(m.doc_date)}</strong></p>
  </div>
</div>`;
}

/** Angebot-Seite: kompaktere Adresszeilen, Datum rechts. */
function addressBlockOffer(m: BookingDocPlaceholders): string {
  return `<div class="address-block">
  <div class="address-block-grid">
    <div class="address-block-main">
      <p class="address-line address-salutation">An <strong>${e(m.first_name)} ${e(m.last_name)}</strong></p>
      <p class="address-line">${e(m.city)} ${e(m.country)}</p>
      <p class="address-line address-offer-no"><span class="address-offer-label">Angebotsnummer:</span> ${e(m.offer_no)}</p>
    </div>
    <p class="address-datum-line"><strong>Datum: ${e(m.doc_date)}</strong></p>
  </div>
</div>`;
}

function page1(m: BookingDocPlaceholders): string {
  const mode = cm(m);
  return `
${addressBlock(m)}
<h1 class="doc-title">Anmeldebestätigung für einen Deutsch Intensivkurs</h1>
<p>Sehr geehrte Damen und Herren,</p>
<p>Hiermit bestätigen wir, dass die unten genannte Person zu einem Deutsch Intensivkurs in unserer Sprachschule angemeldet ist.</p>
<table class="doc-table" role="presentation">
  <tbody>
    <tr><td colspan="2"><strong>Teilnehmende Person:</strong></td></tr>
    <tr><td>Vollständigen Name</td><td><strong>${e(m.first_name)} ${e(m.last_name)}</strong></td></tr>
    <tr><td>Geburtsdatum und -ort:</td><td><strong>${e(m.birth_date)} – ${e(m.birth_place)}</strong></td></tr>
    <tr><td>Staatsangehörigkeit:</td><td><strong>${e(m.nationality)}</strong></td></tr>
  </tbody>
</table>
<table class="doc-table" role="presentation">
  <tbody>
    <tr><td colspan="2"><strong>Kursdetails:</strong></td></tr>
    <tr><td>Kursstufe:</td><td><strong>${e(m.course_level)}</strong></td></tr>
    <tr><td>Kursbeginn und -ende</td><td><strong>${e(m.course_start)} – ${e(m.course_end)} / ins. ${e(m.course_total)} Woche</strong></td></tr>
    <tr><td>Kursumfang:</td><td><strong>${e(m.weekly_hours)} Ue/W – ${mode}</strong></td></tr>
  </tbody>
</table>
<p>Der Kurs dient dem Erwerb und der Weiterentwicklung der deutschen Sprachkenntnisse und kann – je nach individuellem Ziel – sowohl der Vorbereitung auf anerkannte Sprachprüfungen (zB. telc, TestDaF, DSH) als auch einem anschließenden Studium in Deutschland dienen.</p>
<p>Es handelt sich um einen Vollzeit-Intensivkurs im Präsenzformat mit einem Umfang von mindestens 20 Unterrichtsstunden pro Woche.</p>
<p>Die Kurse sind modular aufgebaut und ermöglichen eine kontinuierliche sprachliche Entwicklung über mehrere Niveaustufen hinweg.</p>
<p>Sollte sich der Kursbeginn aufgrund von Verzögerungen im Visumverfahren verschieben, besteht die Möglichkeit, den Kursstart in Abstimmung mit der Sprachschule entsprechend anzupassen.</p>
<p>Diese Bestätigung gilt als offizieller Nachweis der Kursanmeldung und kann im Rahmen von Visums- und Aufenthaltsverfahren bei den zuständigen Behörden vorgelegt werden.</p>
<p>Für weitere Informationen stehen wir Ihnen jederzeit gerne zur Verfügung.</p>
<p class="closing">Mit freundlichen Grüßen<br />Ihsan S. Akman – Der Geschäftsführer</p>`;
}

function page2(m: BookingDocPlaceholders): string {
  const mode = cm(m);
  return `
${addressBlock(m)}
<h1 class="doc-title">Zahlungsbestätigung für einen Deutsch Intensivkurs</h1>
<p>Sehr geehrte Damen und Herren,</p>
<p>Hiermit bestätigen wir, dass die unten genannte Person zu einem Deutsch Intensivkurs in unserer Sprachschule angemeldet ist und entsprechende Zahlungen geleistet hat.</p>
<table class="doc-table" role="presentation">
  <tbody>
    <tr><td colspan="2"><strong>Teilnehmende Person:</strong></td></tr>
    <tr><td>Vollständigen Name</td><td><strong>${e(m.first_name)} ${e(m.last_name)}</strong></td></tr>
    <tr><td>Geburtsdatum und -ort:</td><td><strong>${e(m.birth_date)} – ${e(m.birth_place)}</strong></td></tr>
    <tr><td>Staatsangehörigkeit:</td><td><strong>${e(m.nationality)}</strong></td></tr>
  </tbody>
</table>
<table class="doc-table" role="presentation">
  <tbody>
    <tr><td colspan="2"><strong>Kursdetails:</strong></td></tr>
    <tr><td>Kursstufe und Umfang</td><td><strong>${e(m.course_level)} / ins. ${e(m.course_total)} Woche – ${mode}</strong></td></tr>
  </tbody>
</table>
<table class="doc-table" role="presentation">
  <tbody>
    <tr><td colspan="2"><strong>Zahlungsdetail:</strong></td></tr>
    <tr><td>Gesamtbetrag:</td><td><strong>${e(m.grand_total)} EUR</strong></td></tr>
    <tr><td>Bereits gezahlt:</td><td><strong>${e(m.amount_paid)} EUR</strong></td></tr>
    <tr><td>Offener Restbetrag:</td><td><strong>${e(m.amount_due)} EUR</strong></td></tr>
  </tbody>
</table>
<p>Die bisher geleistete Zahlung wurde korrekt verbucht und bestätigt den reservierten Kursplatz.</p>
<p>Der verbleibende Restbetrag ist nach Erhalt des Visums und vor Kursbeginn zu begleichen. Die vollständige Zahlung der Kursgebühr ist Voraussetzung für die Teilnahme am Kurs.</p>
<p>Der gebuchte Sprachkurs ist im Visum bezogen und wird individuell für die teilnehmende Person reserviert, sodass eine verlässliche Kursplanung gewährleistet ist. Eine Stornierung oder Übertragung des Kursplatzes ist daher grundsätzlich nicht vorgesehen.</p>
<p>Die teilnehmende Person wurde über die Zahlungs- und Teilnahmebedingungen informiert.</p>
<p class="closing">Mit freundlichen Grüßen</p>
<p class="sig-rule">________________________________________________________________</p>
<p class="sig-name">Ihsan S. Akman – Der Geschäftsführer</p>
<p class="sig-rule">________________________________________________________________</p>
<p class="sig-participant">Unterschrift der teilnehmenden Person</p>`;
}

function page3(m: BookingDocPlaceholders): string {
  const mode = cm(m);
  return `
${addressBlock(m)}
<h1 class="doc-title">Bescheinigung zur Vorlage bei der Visumsbeantragung</h1>
<p>Sehr geehrte Damen und Herren,</p>
<p>Hiermit bestätigen wir, dass die unten genannte Person zu einem Deutsch Intensivkurs in unserer Sprachschule angemeldet ist.</p>
<table class="doc-table" role="presentation">
  <tbody>
    <tr><td colspan="2"><strong>Persönliche Angaben:</strong></td></tr>
    <tr><td>Vollständigen Name</td><td><strong>${e(m.first_name)} ${e(m.last_name)}</strong></td></tr>
    <tr><td>Geburtsdatum und -ort:</td><td><strong>${e(m.birth_date)} – ${e(m.birth_place)}</strong></td></tr>
    <tr><td>Staatsangehörigkeit:</td><td><strong>${e(m.nationality)}</strong></td></tr>
    <tr><td>Passnummer:</td><td><strong>${e(m.passport_no)}</strong></td></tr>
    <tr><td>Derzeitiger Wohnort:</td><td><strong>${e(m.city)}, ${e(m.country)}</strong></td></tr>
  </tbody>
</table>
<table class="doc-table" role="presentation">
  <tbody>
    <tr><td colspan="2"><strong>Kursdetails:</strong></td></tr>
    <tr><td>Kursstufe:</td><td><strong>${e(m.course_level)}</strong></td></tr>
    <tr><td>Kursbeginn und -ende</td><td><strong>${e(m.course_start)} – ${e(m.course_end)} / ins. ${e(m.course_total)} Woche</strong></td></tr>
    <tr><td>Kursumfang:</td><td><strong>${e(m.weekly_hours)} Ue/W – ${mode}</strong></td></tr>
  </tbody>
</table>
<p>Der Kurs dient dem Erwerb und der Vertiefung der deutschen Sprachkenntnisse und kann – je nach individuellem Ziel – sowohl der Vorbereitung auf anerkannte Sprachprüfungen (z. B. telc, TestDaF, DSH) als auch einem anschließenden Studium in Deutschland dienen.</p>
<p>Es handelt sich um einen Vollzeit-Sprachkurs. Die Teilnahme am Sprachkurs ist im Rahmen des geplanten Aufenthalts in Deutschland vorgesehen.</p>
<p>Sollte sich der Kursbeginn aufgrund von Verzögerungen im Visumverfahren verschieben, kann der Kursbeginn in Abstimmung mit der Sprachschule entsprechend angepasst werden.</p>
<p>Diese Bescheinigung wird zur Unterstützung des Visumantrags ausgestellt.</p>
<p>Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.</p>
<p class="closing">Mit freundlichen Grüßen<br />Ihsan S. Akman – Der Geschäftsführer</p>`;
}

function page4(m: BookingDocPlaceholders): string {
  const u = e(m.UArt);
  const z = e(m.Zahlungsart);
  return `
${addressBlockOffer(m)}
<h1 class="doc-title">Angebot für Deutsch Intensivkurs</h1>
<p>Sehr geehrte Damen und Herren,<br />Anbei erhalten Sie unser Angebot für einen Deutsch Intensivkurs.</p>
<table class="doc-table doc-table-grid" role="presentation">
  <tbody>
    <tr><td colspan="4"><strong>Kurse &amp; Preise:</strong></td></tr>
    <tr>
      <td>Kursstufe:</td><td><strong>${e(m.course_level)}</strong></td>
      <td>Wochenpreis:</td><td><strong>${e(m.week_price)} €</strong></td>
    </tr>
    <tr>
      <td>Ins. Kurswoche</td><td><strong>${e(m.course_total)} Woche</strong></td>
      <td>Total Wochenpreis:</td><td><strong>${e(m.course_price)} €</strong></td>
    </tr>
    <tr>
      <td>Kursumfang:</td><td><strong>${e(m.weekly_hours)} Ue/W – ${u}</strong></td>
      <td>Zahlungsdetails:</td><td><strong>${z}</strong></td>
    </tr>
  </tbody>
</table>
<table class="doc-table doc-table-grid" role="presentation">
  <tbody>
    <tr><td colspan="4"><strong>sonstige Dienstleistungen:</strong></td></tr>
    <tr>
      <td><strong>Visum Einladung (50€)</strong></td><td>${e(m.visa_inv)}</td>
      <td><strong>BRE Onboarding (100€)</strong></td><td>${e(m.bre_onb)}</td>
    </tr>
    <tr>
      <td><strong>Unterkunftsvermittlung (70€)</strong></td><td>${e(m.unterkunft)}</td>
      <td><strong>Kursmaterial (30€ je 4 Woche)</strong></td><td>${e(m.kurs_mat)}</td>
    </tr>
  </tbody>
</table>
<ul class="doc-bullets">
  <li><strong>Visum Einladung:</strong> Erforderlich zur Vorlage bei der Beantragung eines Sprach- und Studium Visum.</li>
  <li><strong>Unterkunftsvermittlung:</strong> Wir unterstützen bei Unterkünften in Wohngemeinschaften (nach Geschlecht getrennt) mit Einzel- oder Doppelzimmern sowie optional Studio-Apartments. Die Verfügbarkeit kann je nach Kurszeitraum variieren. Weitere Info: <a href="https://campusgerman.com/unterkunft">campusgerman.com/unterkunft</a></li>
  <li><strong>BRE Onboarding:</strong> Unterstützung beim Start in Bremen inkl. Flughafenabholung, mit SIM-Karte und Infos zu wichtigen Schritten, Anmeldung, Aufenthaltstitel und Sperrkonto, weiteren Abläufen.</li>
  <li><strong>Kursmaterial:</strong> Lehrmaterial sowie Kurs- und Arbeitsbuch für den jeweiligen Kurszeitraum.</li>
</ul>
<table class="doc-table doc-table-grid" role="presentation">
  <tbody>
    <tr><td colspan="4"><strong>Bank Details and Total Cost</strong></td></tr>
    <tr>
      <td>Konto Inhaber:</td><td><strong>Campus German Sprachschule GmbH</strong></td>
      <td>SWIFT/BIC</td><td><strong>COBADEFFXXX</strong></td>
    </tr>
    <tr>
      <td>IBAN</td><td><strong>DE75 3004 0000 0497 1263 00</strong></td>
      <td>Bank Name</td><td><strong>Commerzbank AG</strong></td>
    </tr>
    <tr>
      <td>Adresse:</td><td><strong>Florianstr. 15-21, 44139 Dortmund</strong></td>
      <td>Reference:</td><td><strong>${e(m.offer_no_)}</strong></td>
    </tr>
    <tr>
      <td>Zahlungsbetrag</td><td><strong>${e(m.payment_amount)} €</strong></td>
      <td>Total Betrag:</td><td><strong>${e(m.grand_total)} €</strong></td>
    </tr>
  </tbody>
</table>
<p>Die AGB wurden zur Kenntnis genommen. Die teilnehmende Person informiert die Sprachschule spätestens 15 Tage vor Kursbeginn über den Stand des Visum- und Aufenthaltsverfahrens.</p>
<p>Der oben angegebene Zahlbetrag ist innerhalb von 10 Werktagen zu zahlen, ein ggf. verbleibender Restbetrag nach Visumerhalt vor Kursbeginn. Die Teilnahme setzt die vollständige Zahlung voraus.</p>
<p class="closing closing-small">mit Freundlichen Grüßen<br />Ihsan S. Akman – Der Geschäftsführer</p>`;
}

function sheetShell(logoHtml: string, inner: string): string {
  return `<section class="sheet">
  <div class="top-band" aria-hidden="true"></div>
  <header class="header-row">
    ${headerContactBlock()}
    <div class="logo-wrap">${logoHtml}</div>
  </header>
  <div class="body">${inner}</div>
  ${sheetFooterBlock()}
  <div class="bottom-band" aria-hidden="true"></div>
</section>`;
}

export async function buildBookingOfficialHtmlDocument(lead: Lead): Promise<string> {
  if (lead.formType !== "booking") throw new Error("Yalnızca booking");
  const m = buildBookingOfficialPlaceholders(lead);
  const logoHtml = await buildLogoBlock();

  const p1 = sheetShell(logoHtml, page1(m));
  const p2 = sheetShell(logoHtml, page2(m));
  const p3 = sheetShell(logoHtml, page3(m));
  const p4 = sheetShell(logoHtml, page4(m));

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Campus German — Offizielle Dokumente</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      position: relative;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      padding: 0 14mm 0 18mm;
      border-left: 10px solid #c81e1e;
      background: #fff;
      box-sizing: border-box;
    }
    .sheet:last-child { page-break-after: auto; }
    .top-band {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 34mm;
      background: #c8ecf3;
      border-bottom: 1px solid #9fd4e3;
      z-index: 0;
    }
    .bottom-band {
      flex: 0 0 4.5mm;
      width: calc(100% + 18mm + 14mm + 10px);
      max-width: none;
      margin-left: calc(-18mm - 10px);
      margin-right: -14mm;
      margin-top: 0;
      background: #e8b923;
      z-index: 1;
    }
    .header-row {
      position: relative;
      z-index: 2;
      flex: 0 0 auto;
      min-height: 34mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 4mm;
      padding: 6mm 0 6mm 0;
    }
    .header-contact {
      display: flex;
      flex-direction: column;
      gap: 3px;
      max-width: 55%;
      font-size: 9.5pt;
      line-height: 1.4;
      color: #1a2e35;
      font-weight: 600;
    }
    .header-contact-line { display: block; }
    .logo-wrap {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex: 0 0 auto;
      max-width: 42%;
    }
    .logo-img { max-height: 18mm; width: auto; max-width: 100%; object-fit: contain; }
    .logo-fallback { text-align: right; line-height: 1.2; }
    .logo-fallback-title { display: block; font-size: 13pt; font-weight: 700; color: #1a1a1b; letter-spacing: 0.03em; }
    .logo-fallback-sub { display: block; font-size: 9pt; font-weight: 500; color: #475569; margin-top: 2px; }
    .body {
      position: relative;
      z-index: 2;
      flex: 1 1 auto;
      min-height: 0;
      padding-top: 2mm;
      padding-bottom: 3mm;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.45;
      color: #111827;
    }
    .sheet-footer {
      position: relative;
      z-index: 2;
      flex: 0 0 auto;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 3mm 4mm;
      align-items: start;
      padding: 3mm 0 3mm;
      margin-top: auto;
      border-top: 1px solid #cbd5e1;
      font-size: 8.25pt;
      line-height: 1.45;
      color: #1e293b;
    }
    .sheet-footer-col {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .sheet-footer-col span { display: block; }
    .sheet-footer-h {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #0f766e;
      margin-bottom: 4px !important;
      padding-bottom: 2px;
      border-bottom: 1px solid #99f6e4;
    }
    .body p { margin: 0 0 0.5em; }
    .address-block { margin-bottom: 0.85em; }
    .address-block-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 4mm 10mm;
      align-items: start;
    }
    .address-block-main { min-width: 0; }
    .address-line {
      margin: 0 0 0.28em !important;
      font-size: 10pt;
      line-height: 1.4;
      color: #0f172a;
    }
    .address-line:last-child { margin-bottom: 0 !important; }
    .address-salutation { font-size: 10.5pt; }
    .address-salutation strong { font-weight: 700; color: #111827; }
    .address-offer-no { margin-top: 0.35em !important; font-size: 9.75pt; }
    .address-offer-label { font-weight: 600; color: #334155; }
    .address-datum-line {
      margin: 0 !important;
      text-align: right;
      white-space: nowrap;
      font-size: 10pt;
      line-height: 1.4;
      color: #0f172a;
    }
    .doc-title {
      font-size: 11pt;
      font-weight: 700;
      margin: 0.6em 0 0.5em;
    }
    table.doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin: 0.5em 0 0.75em;
    }
    table.doc-table td {
      border: 1px solid #d1d5db;
      padding: 5px 8px;
      vertical-align: top;
    }
    table.doc-table:not(.doc-table-grid) td:first-child {
      width: 38%;
      background: #f9fafb;
      font-weight: 500;
    }
    table.doc-table-grid td {
      width: 25%;
      background: #fff;
      font-size: 8.5pt;
    }
    table.doc-table-grid tr:first-child td {
      background: #f3f4f6;
      font-weight: 600;
    }
    .doc-bullets { margin: 0.5em 0 0.75em; padding-left: 1.15em; }
    .doc-bullets li { margin-bottom: 0.35em; }
    .doc-bullets a { color: #1d4ed8; }
    .closing { margin-top: 1em; }
    .closing-small { margin-top: 0.75em; font-size: 9pt; }
    .sig-rule { font-family: ui-monospace, monospace; letter-spacing: -0.05em; color: #6b7280; margin: 0.3em 0; }
    .sig-name { margin: 0.15em 0 0.8em; }
    .sig-participant { font-size: 8.5pt; color: #374151; margin-top: 0; }
  </style>
</head>
<body>
${p1}
${p2}
${p3}
${p4}
</body>
</html>`;
}
