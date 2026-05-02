import type { NextRequest } from "next/server";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

const buckets = new Map<string, number[]>();

export function getWebhookClientKey(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

/** true = izin var, false = 429 */
export function checkWebhookRateLimit(req: NextRequest): boolean {
  const key = getWebhookClientKey(req);
  const now = Date.now();
  const prev = buckets.get(key) ?? [];
  const recent = prev.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}
