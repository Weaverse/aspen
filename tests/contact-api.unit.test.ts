import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { ActionFunctionArgs } from "react-router";
import { action, loader } from "../app/routes/($locale).api.contact.ts";

const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

type ContactApiResult = {
  data: { ok: boolean; error?: string };
  init?: ResponseInit;
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
});

function request(fields: Record<string, string>, method = "POST"): Request {
  return new Request("https://store.example/api/contact", {
    method,
    headers: { Origin: "https://store.example" },
    body: new URLSearchParams(fields),
  });
}

async function submit(
  fields: Record<string, string>,
  options: { method?: string; token?: string } = {},
) {
  return action({
    request: request(fields, options.method),
    context: {
      env: { KLAVIYO_PRIVATE_API_TOKEN: options.token },
    },
    params: {},
  } as unknown as ActionFunctionArgs) as Promise<ContactApiResult>;
}

test("GET requests return a controlled 405 response", async () => {
  const result = await loader();

  assert.equal(result.init?.status, 405);
  assert.equal(new Headers(result.init?.headers).get("Allow"), "POST");
  assert.deepEqual(result.data, { ok: false, error: "Method not allowed" });
});

test("rejects missing and invalid fields before contacting Klaviyo", async () => {
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(null, { status: 202 });
  };

  const missingEmail = await submit({ message: "Hello" }, { token: "test" });
  const invalidEmail = await submit(
    { email: "not-an-email", message: "Hello" },
    { token: "test" },
  );
  const missingMessage = await submit(
    { email: "person@example.org" },
    { token: "test" },
  );

  assert.equal(missingEmail.init?.status, 400);
  assert.equal(invalidEmail.init?.status, 400);
  assert.equal(invalidEmail.data.error, "Enter a valid email address");
  assert.equal(missingMessage.init?.status, 400);
  assert.equal(fetchCalls, 0);
});

test("rejects cross-origin submissions before contacting Klaviyo", async () => {
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(null, { status: 202 });
  };

  const crossOriginRequest = new Request("https://store.example/api/contact", {
    method: "POST",
    headers: { Origin: "https://evil.example" },
    body: new URLSearchParams({
      email: "person@example.org",
      message: "Hello",
    }),
  });
  const result = (await action({
    request: crossOriginRequest,
    context: { env: { KLAVIYO_PRIVATE_API_TOKEN: "test" } },
    params: {},
  } as unknown as ActionFunctionArgs)) as ContactApiResult;

  assert.equal(result.init?.status, 403);
  assert.equal(fetchCalls, 0);
});

test("returns a safe fallback when Klaviyo is unconfigured", async () => {
  console.error = () => undefined;
  const result = await submit({
    email: "person@example.org",
    message: "Hello",
  });

  assert.equal(result.init?.status, 503);
  assert.deepEqual(result.data, {
    ok: false,
    error: "Something went wrong! Please try again.",
  });
});

test("sends a valid event without exposing the private token", async () => {
  let capturedRequest: { input: string; init?: RequestInit } | undefined;
  globalThis.fetch = async (input, init) => {
    capturedRequest = { input: String(input), init };
    return new Response(null, { status: 202 });
  };

  const result = await submit(
    {
      name: "  Aspen Tester  ",
      email: "Person@Example.org",
      message: "  I need help  ",
    },
    { token: "private-test-token" },
  );

  assert.equal(result.init?.status, 202);
  assert.deepEqual(result.data, { ok: true });
  assert.equal(capturedRequest?.input, "https://a.klaviyo.com/api/events");
  assert.equal(capturedRequest?.init?.method, "POST");

  const headers = new Headers(capturedRequest?.init?.headers);
  assert.equal(headers.get("revision"), "2026-07-15");
  assert.equal(
    headers.get("Authorization"),
    "Klaviyo-API-Key private-test-token",
  );

  const body = JSON.parse(String(capturedRequest?.init?.body)) as {
    data: {
      attributes: {
        profile: {
          data: { attributes: { email: string; first_name?: string } };
        };
        properties: { message: string };
      };
    };
  };
  assert.equal(
    body.data.attributes.profile.data.attributes.email,
    "person@example.org",
  );
  assert.equal(
    body.data.attributes.profile.data.attributes.first_name,
    "Aspen Tester",
  );
  assert.equal(body.data.attributes.properties.message, "I need help");
  assert.doesNotMatch(JSON.stringify(body), /private-test-token/);
});

test("maps Klaviyo and network failures to a safe gateway error", async () => {
  console.error = () => undefined;
  globalThis.fetch = async () => new Response(null, { status: 429 });
  const rejected = await submit(
    { email: "person@example.org", message: "Hello" },
    { token: "test" },
  );

  globalThis.fetch = async () => {
    throw new Error("network unavailable");
  };
  const networkFailure = await submit(
    { email: "person@example.org", message: "Hello" },
    { token: "test" },
  );

  assert.equal(rejected.init?.status, 502);
  assert.equal(networkFailure.init?.status, 502);
  assert.equal(rejected.data.error, "Something went wrong! Please try again.");
  assert.equal(
    networkFailure.data.error,
    "Something went wrong! Please try again.",
  );
});
