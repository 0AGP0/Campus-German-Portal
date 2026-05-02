import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_PASSPORT_BYTES = 10 * 1024 * 1024;
/** Ham PNG bayt üst sınırı (imza) */
export const MAX_SIGNATURE_DECODED_BYTES = 300 * 1024;
/** data:image/png;base64,... string uzunluk üst sınırı (yaklaşık) */
export const MAX_SIGNATURE_TEXT_CHARS = 450_000;

export const PASSPORT_MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const ALLOWED_PASSPORT_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export function getUploadRoot(): string {
  const fromEnv = process.env.UPLOAD_DIR?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : path.join(process.cwd(), "uploads");
}

export async function ensureLeadUploadDir(leadId: string): Promise<string> {
  const dir = path.join(getUploadRoot(), "private-documents", leadId);
  await mkdir(dir, { recursive: true, mode: 0o750 });
  return dir;
}

/** DB / API yanıtında kullanılacak göreli anahtar (uploads köküne göre) */
export function relativeUploadKey(leadId: string, filename: string): string {
  return path.posix.join("private-documents", leadId, filename);
}

export function extFromMime(mime: string): string | null {
  const m = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  return PASSPORT_MIME_TO_EXT[m] ?? null;
}

/**
 * data:image/png;base64,... veya ham base64 kabul eder.
 * Başarılıysa dosyaya yazar; göreli anahtar döner.
 */
export async function saveSignaturePng(
  leadId: string,
  raw: string,
): Promise<{ relativeKey: string } | { error: string; status: 413 | 422 }> {
  const trimmed = raw.trim();
  if (trimmed.length > MAX_SIGNATURE_TEXT_CHARS) {
    return { error: "İmza verisi çok büyük (maks. ~300 KB)", status: 413 };
  }
  let b64 = trimmed;
  const dataUrl = /^data:image\/png;base64,/i.exec(trimmed);
  if (dataUrl) {
    b64 = trimmed.slice(dataUrl[0].length);
  }
  let buf: Buffer;
  try {
    buf = Buffer.from(b64, "base64");
  } catch {
    return { error: "İmza base64 çözülemedi", status: 422 };
  }
  if (buf.length === 0) {
    return { error: "İmza verisi boş", status: 422 };
  }
  if (buf.length > MAX_SIGNATURE_DECODED_BYTES) {
    return { error: "İmza görüntüsü çok büyük (maks. 300 KB)", status: 413 };
  }
  const pngHeader = buf.subarray(0, 8);
  if (pngHeader[0] !== 0x89 || pngHeader[1] !== 0x50 || pngHeader[2] !== 0x4e || pngHeader[3] !== 0x47) {
    return { error: "İmza geçerli PNG değil", status: 422 };
  }
  const dir = await ensureLeadUploadDir(leadId);
  const filename = "signature.png";
  const full = path.join(dir, filename);
  await writeFile(full, buf, { mode: 0o640 });
  return { relativeKey: relativeUploadKey(leadId, filename) };
}

export async function savePassportFile(
  leadId: string,
  file: File,
): Promise<{ relativeKey: string; mime: string } | { error: string; status: 413 | 415 | 422 }> {
  if (file.size > MAX_PASSPORT_BYTES) {
    return { error: `Pasaport dosyası çok büyük (maks. ${MAX_PASSPORT_BYTES / 1024 / 1024} MB)`, status: 413 };
  }
  const mime = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!ALLOWED_PASSPORT_MIMES.has(mime)) {
    return {
      error: "Pasaport dosya türü desteklenmiyor (PDF, JPEG, PNG, WEBP)",
      status: 415,
    };
  }
  const ext = extFromMime(mime);
  if (!ext) {
    return { error: "Geçersiz MIME", status: 415 };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_PASSPORT_BYTES) {
    return { error: "Pasaport dosyası çok büyük", status: 413 };
  }
  const dir = await ensureLeadUploadDir(leadId);
  const safeName = `passport_copy${ext}`;
  const full = path.join(dir, safeName);
  await writeFile(full, buf, { mode: 0o640 });
  return { relativeKey: relativeUploadKey(leadId, safeName), mime };
}

export function newLeadId(): string {
  return randomUUID();
}
