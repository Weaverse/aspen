import assert from "node:assert/strict";
import test from "node:test";
import {
  createFixedWindowRateLimiter,
  getRequestClientAddress,
  isSameOriginPost,
} from "../app/utils/request-security.server.ts";

test("accepts only same-origin POST requests", () => {
  assert.equal(
    isSameOriginPost(
      new Request("https://shop.example/api/back-in-stock", {
        method: "POST",
        headers: { Origin: "https://shop.example" },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOriginPost(
      new Request("https://shop.example/api/back-in-stock", {
        method: "POST",
        headers: { Origin: "https://evil.example" },
      }),
    ),
    false,
  );
  assert.equal(
    isSameOriginPost(
      new Request("https://shop.example/api/back-in-stock", {
        method: "POST",
      }),
    ),
    false,
  );
  assert.equal(
    isSameOriginPost(
      new Request("https://shop.example/api/back-in-stock", {
        method: "PUT",
        headers: { Origin: "https://shop.example" },
      }),
    ),
    false,
  );
});

test("uses trusted proxy address headers in priority order", () => {
  const request = new Request("https://shop.example/api/back-in-stock", {
    headers: {
      "CF-Connecting-IP": "203.0.113.1",
      "Shopify-Client-IP": "203.0.113.2",
      "X-Forwarded-For": "203.0.113.3, 203.0.113.4",
    },
  });

  assert.equal(getRequestClientAddress(request), "203.0.113.1");
});

test("blocks repeated requests until the fixed window expires", () => {
  const limiter = createFixedWindowRateLimiter({ limit: 2, windowMs: 1_000 });

  assert.deepEqual(limiter.consume("client", 1_000), {
    allowed: true,
    remaining: 1,
    retryAfter: 0,
  });
  assert.deepEqual(limiter.consume("client", 1_100), {
    allowed: true,
    remaining: 0,
    retryAfter: 0,
  });
  assert.deepEqual(limiter.consume("client", 1_200), {
    allowed: false,
    remaining: 0,
    retryAfter: 1,
  });
  assert.deepEqual(limiter.consume("client", 2_000), {
    allowed: true,
    remaining: 1,
    retryAfter: 0,
  });
});
