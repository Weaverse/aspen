import assert from "node:assert/strict";
import test from "node:test";
import { isSameOriginPost } from "../app/utils/request-security.server.ts";

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
