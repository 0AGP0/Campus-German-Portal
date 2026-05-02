import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaLeadToDto } from "@/lib/mappers";
import { notifyNewLeadEmail } from "@/lib/mail";
import { verifyPrivateDocumentsWebhook } from "@/lib/webhook-verify";
import { checkWebhookRateLimit } from "@/lib/webhook-rate-limit";
import {
  newLeadId,
  savePassportFile,
  saveSignaturePng,
} from "@/lib/private-documents-storage";

export const runtime = "nodejs";

/**
 * Multipart örnek (aynı WEBHOOK_SECRET):
 * curl -sS -X POST "http://127.0.0.1:3000/api/webhooks/private-documents" \
 *   -H "x-webhook-secret: $WEBHOOK_SECRET" \
 *   -F 'formType=private-documents-form' \
 *   -F 'sourcePage=/tr/ozel-evrak' -F 'lang=tr' \
 *   -F 'first_name=Ada' -F 'last_name=Test' -F 'email=ada@example.com' \
 *   -F 'digitalSignature=data:image/png;base64,iVBORw0KGgo=' \
 *   -F 'passport_copy=@/path/to/file.pdf'
 */

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "Özel evrak için POST + multipart/form-data; header: x-webhook-secret",
  });
}

function str(v: FormDataEntryValue | null): string {
  if (v === null) return "";
  if (typeof v === "string") return v.trim();
  return "";
}

function normalizeCheckbox(v: FormDataEntryValue | null): boolean {
  if (v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "on" || s === "true" || s === "1" || s === "yes";
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  if (!verifyPrivateDocumentsWebhook(req)) {
    return NextResponse.json(
      {
        error:
          "Webhook doğrulanamadı. Header: x-webhook-secret veya Authorization: Bearer ile WEBHOOK_SECRET gönderin; sunucuda WEBHOOK_SECRET tanımlı olmalıdır.",
      },
      { status: 401 },
    );
  }

  if (!checkWebhookRateLimit(req)) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "İçerik türü multipart/form-data olmalıdır" },
      { status: 415 },
    );
  }

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ error: "Form verisi okunamadı" }, { status: 400 });
  }

  const formType = str(fd.get("formType"));
  if (formType !== "private-documents-form") {
    return NextResponse.json(
      { error: 'formType alanı "private-documents-form" olmalıdır' },
      { status: 400 },
    );
  }

  const first_name = str(fd.get("first_name"));
  const last_name = str(fd.get("last_name"));
  const email = str(fd.get("email"));
  const birth_date = str(fd.get("birth_date"));
  const nationality = str(fd.get("nationality"));
  const birth_place = str(fd.get("birth_place"));
  const passport_no = str(fd.get("passport_no"));
  const city = str(fd.get("city"));
  const country = str(fd.get("country"));
  const phone = str(fd.get("phone"));
  const message = str(fd.get("message"));
  const sourcePage = str(fd.get("sourcePage"));
  const lang = str(fd.get("lang"));
  const stageRaw = str(fd.get("stage"));
  const digitalSignature = str(fd.get("digitalSignature"));

  const terms_accepted = normalizeCheckbox(fd.get("terms-accepted"));
  const privacy_accepted = normalizeCheckbox(fd.get("privacy-accepted"));

  const passportEntry = fd.get("passport_copy");
  const passportFile =
    passportEntry && typeof passportEntry !== "string" && "arrayBuffer" in passportEntry
      ? (passportEntry as File)
      : null;

  if (!first_name || !last_name) {
    return NextResponse.json({ error: "Ad (first_name) ve soyad (last_name) zorunludur" }, { status: 422 });
  }
  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: "Geçerli bir e-posta (email) gerekli" }, { status: 422 });
  }
  if (!digitalSignature) {
    return NextResponse.json({ error: "Dijital imza (digitalSignature) gerekli" }, { status: 422 });
  }
  if (!passportFile || passportFile.size === 0) {
    return NextResponse.json({ error: "Pasaport kopyası (passport_copy) dosyası gerekli" }, { status: 422 });
  }
  if (!terms_accepted || !privacy_accepted) {
    return NextResponse.json(
      { error: "Şartlar ve gizlilik onayı (terms-accepted, privacy-accepted) zorunludur" },
      { status: 422 },
    );
  }

  const leadId = newLeadId();
  const formDate = new Date().toISOString().slice(0, 10);

  const passResult = await savePassportFile(leadId, passportFile);
  if ("error" in passResult) {
    return NextResponse.json({ error: passResult.error }, { status: passResult.status });
  }

  const sigResult = await saveSignaturePng(leadId, digitalSignature);
  if ("error" in sigResult) {
    return NextResponse.json({ error: sigResult.error }, { status: sigResult.status });
  }

  const name = [first_name, last_name].filter(Boolean).join(" ").trim() || "İsimsiz başvuru";
  const course = passport_no ? `Özel evrak · ${passport_no}` : "Özel evrak";
  const sourceBase = "Site — Özel evrak";
  const source = sourcePage ? `${sourceBase} (${sourcePage})` : sourceBase;
  const stage = stageRaw || "yeni";

  const formDataRecord: Record<string, string> = {
    first_name,
    last_name,
    email,
    phone,
    city,
    country,
    birth_date,
    nationality,
    birth_place,
    passport_no,
    message,
    sourcePage,
    lang,
    passport_copy_path: passResult.relativeKey,
    digital_signature_path: sigResult.relativeKey,
    terms_accepted: "evet",
    privacy_accepted: "evet",
    formDate,
  };

  try {
    await prisma.lead.create({
      data: {
        id: leadId,
        name,
        email,
        phone: phone || "—",
        stage,
        course,
        city: city || "—",
        value: "—",
        formType: "private-documents-form",
        formData: formDataRecord as Prisma.InputJsonValue,
        source,
        priority: "B",
        language: lang || "—",
        nextStep: "—",
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Bu kayıt kimliği çakıştı; tekrar deneyin" }, { status: 409 });
    }
    throw e;
  }

  const row = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    include: { notes: { orderBy: { createdAt: "asc" } }, tags: true },
  });
  const dto = prismaLeadToDto(row);
  try {
    await notifyNewLeadEmail(dto);
  } catch (err) {
    console.warn("Lead e-postası gönderilemedi", err);
  }
  return NextResponse.json({ lead: dto }, { status: 201 });
}
