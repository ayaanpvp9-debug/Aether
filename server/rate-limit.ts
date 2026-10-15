/**
 * Sliding-window, in-memory rate limiter keyed by client IP.
 * Bounded in size and periodically pruned so it cannot grow without limit.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  hit(key: string, now?: number): RateLimitResult;
  reset(): void;
  dispose(): void;
}

export function createRateLimiter({ max, windowMs, maxKeys = 10_000 }: { max: number; windowMs: number; maxKeys?: number }): RateLimiter {
  const hits = new Map<string, number[]>();

  const prune = (now: number) => {
    for (const [key, stamps] of hits) {
      const fresh = stamps.filter((t) => now - t < windowMs);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  };

  const timer = setInterval(() => prune(Date.now()), Math.min(windowMs, 60_000));
  timer.unref?.();

  return {
    hit(key, now = Date.now()) {
      const stamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (stamps.length >= max) {
        const retryAfterMs = windowMs - (now - stamps[0]!);
        hits.set(key, stamps);
        return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
      }
      if (!hits.has(key) && hits.size >= maxKeys) prune(now);
      if (hits.size >= maxKeys) {
        // Still saturated after pruning: evict the oldest entry.
        const oldest = hits.keys().next().value;
        if (oldest !== undefined) hits.delete(oldest);
      }
      stamps.push(now);
      hits.set(key, stamps);
      return { allowed: true, remaining: max - stamps.length, retryAfterSeconds: 0 };
    },
    reset() {
      hits.clear();
    },
    dispose() {
      clearInterval(timer);
      hits.clear();
    },
  };
}
