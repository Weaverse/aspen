import {
  type ActionFunction,
  type ActionFunctionArgs,
  data,
} from "react-router";
import { isSameOriginPost } from "../utils/request-security.server.ts";

// Contact form submissions are recorded as Klaviyo events; see docs/integrations.md.
const KLAVIYO_EVENTS_API = "https://a.klaviyo.com/api/events";
const KLAVIYO_API_REVISION = "2026-07-15";

const GENERIC_ERROR = "Something went wrong! Please try again.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5000;

const methodNotAllowed = () =>
  data(
    { ok: false, error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );

export const loader = methodNotAllowed;

export const action: ActionFunction = async ({
  request,
  context,
}: ActionFunctionArgs) => {
  if (request.method.toUpperCase() !== "POST") {
    return methodNotAllowed();
  }
  if (!isSameOriginPost(request)) {
    return data({ ok: false, error: GENERIC_ERROR }, 403);
  }

  const formData = await request.formData();
  const rawName = formData.get("name");
  const rawEmail = formData.get("email");
  const rawMessage = formData.get("message");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";

  if (!email) {
    return data({ ok: false, error: "Email is required" }, 400);
  }
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return data({ ok: false, error: "Enter a valid email address" }, 400);
  }
  if (!message) {
    return data({ ok: false, error: "Message is required" }, 400);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return data(
      { ok: false, error: "Message must be 5000 characters or fewer" },
      400,
    );
  }
  if (name.length > MAX_NAME_LENGTH) {
    return data(
      { ok: false, error: "Name must be 200 characters or fewer" },
      400,
    );
  }

  const apiToken = context.env.KLAVIYO_PRIVATE_API_TOKEN;
  if (!apiToken) {
    console.error(
      "Contact form unavailable: KLAVIYO_PRIVATE_API_TOKEN is not set",
    );
    return data({ ok: false, error: GENERIC_ERROR }, 503);
  }

  try {
    const res = await fetch(KLAVIYO_EVENTS_API, {
      method: "POST",
      headers: {
        accept: "application/vnd.api+json",
        revision: KLAVIYO_API_REVISION,
        "content-type": "application/vnd.api+json",
        Authorization: `Klaviyo-API-Key ${apiToken}`,
      },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            properties: {
              name,
              message,
            },
            metric: {
              data: {
                type: "metric",
                attributes: { name: "Contact Form Submission" },
              },
            },
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: email.toLowerCase(),
                  ...(name ? { first_name: name } : {}),
                },
              },
            },
          },
        },
      }),
    });

    if (res.ok) {
      return data({ ok: true }, 202);
    }
    console.error("Klaviyo contact event failed with status", res.status);
    return data({ ok: false, error: GENERIC_ERROR }, 502);
  } catch (error) {
    console.error("Klaviyo contact event failed", error);
    return data({ ok: false, error: GENERIC_ERROR }, 502);
  }
};
