import nodemailer from "nodemailer";
import type { Lead } from "@/data/leads";

let warnedNoSmtp = false;

export async function notifyNewLeadEmail(lead: Lead): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() ?? user;
  const to = process.env.NOTIFY_EMAIL?.trim();

  if (!host || !to) {
    if (!warnedNoSmtp) {
      warnedNoSmtp = true;
      console.log("SMTP/NOTIFY_EMAIL tanımlı değil — yeni lead e-postası gönderilmeyecek.");
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "1",
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from,
    to,
    subject: `[CRM] Yeni başvuru: ${lead.name}`,
    text: `Kaynak: ${lead.source}\nE-posta: ${lead.email}\nAşama: ${lead.stage}\n`,
  });
}
