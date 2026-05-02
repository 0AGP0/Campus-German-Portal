import type { NextRequest } from "next/server";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET?.trim();
let warnedWebhook = false;

/** İstemcilerden gelen olası token değerleri (Make.com / curl / bazı proxy’ler) */
function collectWebhookTokens(req: NextRequest): string[] {
  const out: string[] = [];
  const x = req.headers.get("x-webhook-secret")?.trim();
  if (x) out.push(x);

  const a = req.headers.get("authorization")?.trim();
  if (a) {
    const low = a.toLowerCase();
    if (low.startsWith("bearer ")) {
      out.push(a.slice(7).trim());
    } else {
      out.push(a);
    }
  }
  return out;
}

export function verifyWebhook(req: NextRequest): boolean {
  if (!WEBHOOK_SECRET) {
    if (!warnedWebhook) {
      warnedWebhook = true;
      console.warn("WEBHOOK_SECRET tanımlı değil — webhook herkese açık (yalnızca geliştirme)");
    }
    return true;
  }
  return collectWebhookTokens(req).some((t) => t === WEBHOOK_SECRET);
}

/** Özel evrak webhook: `WEBHOOK_SECRET` zorunlu; yok veya yanlış → false (401) */
export function verifyPrivateDocumentsWebhook(req: NextRequest): boolean {
  const secret = process.env.WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  return collectWebhookTokens(req).some((t) => t === secret);
}
