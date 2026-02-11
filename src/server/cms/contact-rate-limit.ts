type RateLimitResult = {
  ok: boolean;
  retryAfterSeconds?: number;
};

const requestsByKey = new Map<string, number[]>();

function resolveWindowMs() {
  const value = Number(process.env.CMS_CONTACT_RATE_LIMIT_WINDOW_MS || "600000");
  if (!Number.isFinite(value)) return 600_000;
  return Math.max(30_000, Math.trunc(value));
}

function resolveMaxPerWindow() {
  const value = Number(process.env.CMS_CONTACT_RATE_LIMIT_MAX || "5");
  if (!Number.isFinite(value)) return 5;
  return Math.max(1, Math.trunc(value));
}

function cleanupStale(windowMs: number, now: number) {
  if (requestsByKey.size < 5000) return;
  for (const [key, timestamps] of requestsByKey.entries()) {
    const next = timestamps.filter((ts) => now - ts <= windowMs);
    if (next.length === 0) requestsByKey.delete(key);
    else requestsByKey.set(key, next);
  }
}

export function consumeCmsContactRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const windowMs = resolveWindowMs();
  const maxPerWindow = resolveMaxPerWindow();

  cleanupStale(windowMs, now);

  const timestamps = requestsByKey.get(key) ?? [];
  const valid = timestamps.filter((ts) => now - ts <= windowMs);

  if (valid.length >= maxPerWindow) {
    const oldest = valid[0] ?? now;
    const retryAfterMs = Math.max(1, windowMs - (now - oldest));
    return {
      ok: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  valid.push(now);
  requestsByKey.set(key, valid);
  return { ok: true };
}
