import type { NextRequest } from "next/server";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET?.trim();
let warnedWebhook = false;

function getBearer(req: NextRequest): string | undefined {
  const a = req.headers.get("authorization");
  if (a?.startsWith("Bearer ")) return a.slice(7).trim();
  return undefined;
}

export function verifyWebhook(req: NextRequest): boolean {
  if (!WEBHOOK_SECRET) {
    if (!warnedWebhook) {
      warnedWebhook = true;
      console.warn("WEBHOOK_SECRET tanımlı değil — webhook herkese açık (yalnızca geliştirme)");
    }
    return true;
  }
  const h = req.headers.get("x-webhook-secret")?.trim();
  const b = getBearer(req);
  return h === WEBHOOK_SECRET || b === WEBHOOK_SECRET;
}
