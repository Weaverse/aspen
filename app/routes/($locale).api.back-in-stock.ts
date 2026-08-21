import {
  type ActionFunction,
  type ActionFunctionArgs,
  data,
} from "react-router";
import {
  createKlaviyoBackInStockSubscription,
  hasKlaviyoErrorCode,
  KLAVIYO_GENERIC_ERROR,
  KLAVIYO_INVALID_EMAIL_ERROR,
  readKlaviyoErrorPayload,
} from "~/utils/klaviyo.server";
import {
  createFixedWindowRateLimiter,
  getRequestClientAddress,
  isSameOriginPost,
} from "~/utils/request-security.server";
import { shopifyNumericId } from "~/utils/shopify-id";

const backInStockRateLimiter = createFixedWindowRateLimiter({
  limit: 5,
  windowMs: 60_000,
});

export const action: ActionFunction = async ({
  request,
  context,
}: ActionFunctionArgs) => {
  if (request.method.toUpperCase() !== "POST") {
    return data(
      { ok: false, error: KLAVIYO_GENERIC_ERROR },
      { status: 405, headers: { Allow: "POST" } },
    );
  }

  if (!isSameOriginPost(request)) {
    return data({ ok: false, error: KLAVIYO_GENERIC_ERROR }, 403);
  }

  const rateLimit = backInStockRateLimiter.consume(
    getRequestClientAddress(request),
  );
  if (!rateLimit.allowed) {
    return data(
      { ok: false, error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    );
  }

  const apiToken = context.env.KLAVIYO_PRIVATE_API_TOKEN;
  if (!apiToken) {
    console.error(
      "Back-in-stock signup unavailable: KLAVIYO_PRIVATE_API_TOKEN is not set",
    );
    return data({ ok: false, error: KLAVIYO_GENERIC_ERROR }, 503);
  }

  const formData = await request.formData();
  const submittedEmail = formData.get("email");
  const variantId = formData.get("variantId");
  const email =
    typeof submittedEmail === "string"
      ? submittedEmail.trim().toLowerCase()
      : "";

  if (!isValidEmail(email)) {
    return data({ ok: false, error: KLAVIYO_INVALID_EMAIL_ERROR }, 400);
  }

  const numericVariantId =
    typeof variantId === "string" ? shopifyNumericId(variantId) : "";
  if (!numericVariantId) {
    return data({ ok: false, error: "A product variant is required" }, 400);
  }

  try {
    const res = await createKlaviyoBackInStockSubscription({
      apiToken,
      email,
      variantId: numericVariantId,
    });

    if (res.ok) {
      return data({ ok: true }, 201);
    }

    const payload = await readKlaviyoErrorPayload(res);

    // Already subscribed for this variant.
    if (
      res.status === 409 ||
      hasKlaviyoErrorCode(payload, "duplicate") ||
      hasKlaviyoErrorCode(payload, "already_subscribed")
    ) {
      return data({ ok: true }, 200);
    }

    console.error(
      `Klaviyo back-in-stock failed with status ${res.status}:`,
      JSON.stringify(payload),
    );

    if (res.status === 400) {
      return data({ ok: false, error: KLAVIYO_INVALID_EMAIL_ERROR }, 400);
    }
    if (res.status === 404) {
      return data(
        {
          ok: false,
          error:
            "This product isn't available for restock alerts yet. Please try again later.",
        },
        422,
      );
    }
    return data({ ok: false, error: KLAVIYO_GENERIC_ERROR }, res.status);
  } catch (error) {
    console.error("Klaviyo back-in-stock request failed:", error);
    return data({ ok: false, error: KLAVIYO_GENERIC_ERROR }, 500);
  }
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
