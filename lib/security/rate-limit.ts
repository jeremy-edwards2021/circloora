export interface RateLimiter {
  check(key: string): RateLimitResult;
  reset(key: string): void;
  middleware(keyFn: (request: Request) => string): (request: Request) => Promise<Response | null>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(
  windowMs: number,
  maxRequests: number,
): RateLimiter {
  const buckets = new Map<string, Bucket>();

  function prune(): void {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }

  function check(key: string): RateLimitResult {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMs,
        retryAfterSeconds: 0,
      };
    }

    if (bucket.count >= maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1_000),
      );
      return {
        allowed: false,
        remaining: 0,
        resetAt: bucket.resetAt,
        retryAfterSeconds,
      };
    }

    bucket.count += 1;
    return {
      allowed: true,
      remaining: maxRequests - bucket.count,
      resetAt: bucket.resetAt,
      retryAfterSeconds: 0,
    };
  }

  function reset(key: string): void {
    buckets.delete(key);
  }

  function middleware(
    keyFn: (request: Request) => string,
  ): (request: Request) => Promise<Response | null> {
    return async (request: Request): Promise<Response | null> => {
      const key = keyFn(request);
      const result = check(key);
      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: { code: "rate_limited", retryAfter: result.retryAfterSeconds },
          }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": String(result.retryAfterSeconds),
              "x-ratelimit-limit": String(maxRequests),
              "x-ratelimit-remaining": "0",
              "x-ratelimit-reset": String(result.resetAt),
            },
          },
        );
      }
      return null;
    };
  }

  const interval = Math.max(windowMs, 60_000);
  const timer = setInterval(prune, interval);
  if (typeof timer === "object" && "unref" in timer) {
    timer.unref();
  }

  return { check, reset, middleware };
}
