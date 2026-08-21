type RateLimitWindow = {
  count: number;
  resetAt: number;
};

type RateLimitResult =
  | { allowed: true; remaining: number; retryAfter: 0 }
  | { allowed: false; remaining: 0; retryAfter: number };

export function isSameOriginPost(request: Request) {
  if (request.method.toUpperCase() !== "POST") {
    return false;
  }

  const origin = request.headers.get("Origin");
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function getRequestClientAddress(request: Request) {
  const forwardedFor = request.headers.get("X-Forwarded-For");

  return (
    request.headers.get("CF-Connecting-IP")?.trim() ||
    request.headers.get("Shopify-Client-IP")?.trim() ||
    forwardedFor?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function createFixedWindowRateLimiter({
  limit,
  windowMs,
  maxEntries = 5000,
}: {
  limit: number;
  windowMs: number;
  maxEntries?: number;
}) {
  const windows = new Map<string, RateLimitWindow>();

  return {
    consume(key: string, now = Date.now()): RateLimitResult {
      const current = windows.get(key);

      if (!current || current.resetAt <= now) {
        if (windows.size >= maxEntries) {
          removeExpiredWindows(windows, now);
        }
        if (windows.size >= maxEntries) {
          windows.delete(windows.keys().next().value as string);
        }

        windows.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1, retryAfter: 0 };
      }

      if (current.count >= limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
        };
      }

      current.count += 1;
      return {
        allowed: true,
        remaining: limit - current.count,
        retryAfter: 0,
      };
    },
  };
}

function removeExpiredWindows(
  windows: Map<string, RateLimitWindow>,
  now: number,
) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) {
      windows.delete(key);
    }
  }
}
