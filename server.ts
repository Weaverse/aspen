import * as remixBuild from "virtual:react-router/server-build"; // Virtual entry point for the app
import type { HydrogenSession } from "@shopify/hydrogen";
import { createHydrogenContext, storefrontRedirect } from "@shopify/hydrogen";
import { createRequestHandler } from "@shopify/hydrogen/oxygen";
import { WeaverseClient } from "@weaverse/hydrogen";
import {
  createCookieSessionStorage,
  type Session,
  type SessionStorage,
} from "react-router";
import { getCanonicalLocaleRedirect } from "~/utils/locale";
import {
  getRequestI18n,
  loadStoreLocalization,
} from "~/utils/localization.server";
import { components } from "~/weaverse/components";
import { getThemeSchema } from "~/weaverse/schema.server";

// React Router v7 Headers polyfill for getSetCookie compatibility
if (typeof Headers !== "undefined" && !Headers.prototype.getSetCookie) {
  Headers.prototype.getSetCookie = function () {
    const setCookieValues: string[] = [];
    for (const [key, value] of this.entries()) {
      if (key.toLowerCase() === "set-cookie") {
        setCookieValues.push(value);
      }
    }
    return setCookieValues;
  };
}

// Additional polyfill to ensure Headers has proper Set-Cookie handling methods
if (typeof Headers !== "undefined") {
  const originalSet = Headers.prototype.set;
  const originalAppend = Headers.prototype.append;
  const originalGet = Headers.prototype.get;

  Headers.prototype.set = function (name, value) {
    if (name.toLowerCase() === "set-cookie") {
      // Store set-cookie values for later retrieval
      if (!this._setCookies) {
        this._setCookies = [];
      }
      this._setCookies = [value];
    }
    return originalSet.call(this, name, value);
  };

  Headers.prototype.append = function (name, value) {
    if (name.toLowerCase() === "set-cookie") {
      // Store set-cookie values for later retrieval
      if (!this._setCookies) {
        this._setCookies = [];
      }
      this._setCookies.push(value);
    }
    return originalAppend.call(this, name, value);
  };

  // Ensure getSetCookie always works
  if (!Headers.prototype.getSetCookie) {
    Headers.prototype.getSetCookie = function () {
      return this._setCookies || [];
    };
  }
}

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      const appLoadContext = await createAppLoadContext(
        request,
        env,
        executionContext,
      );
      const localeRedirect = getCanonicalLocaleRedirect(
        request,
        appLoadContext.localization,
      );
      if (localeRedirect) {
        return Response.redirect(new URL(localeRedirect, request.url), 302);
      }

      /**
       * Create a Remix request handler and pass
       * Hydrogen's Storefront client to the loader context.
       */
      const handleRequest = createRequestHandler({
        build: remixBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => appLoadContext,
      });

      const response = await handleRequest(request);

      if (appLoadContext.session.isPending) {
        response.headers.set(
          "Set-Cookie",
          await appLoadContext.session.commit(),
        );
      }

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({
          request,
          response,
          storefront: appLoadContext.storefront,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
};

export async function createAppLoadContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open("hydrogen"),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: getRequestI18n(request),
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
        mutateFragment: CART_MUTATE_FRAGMENT,
      },
    },
    {},
  );

  const localization = await loadStoreLocalization(
    hydrogenContext.storefront,
    request,
  );

  const weaverse = new WeaverseClient({
    ...hydrogenContext,
    request,
    cache,
    themeSchema: getThemeSchema(localization),
    components,
  });

  // `createHydrogenContext` returns React Router's context provider. Keep that
  // instance intact: spreading it creates a plain object that middleware rejects.
  return Object.assign(hydrogenContext, { weaverse, localization });
}

class AppSession implements HydrogenSession {
  isPending = false;
  readonly #sessionStorage: SessionStorage;
  readonly #session: Session;

  constructor(sessionStorage: SessionStorage, session: Session) {
    this.#sessionStorage = sessionStorage;
    this.#session = session;
  }

  static async init(request: Request, secrets: string[]) {
    const storage = createCookieSessionStorage({
      cookie: {
        name: "session",
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secrets,
      },
    });

    const session = await storage
      .getSession(request.headers.get("Cookie"))
      .catch(() => storage.getSession());

    return new AppSession(storage, session);
  }

  get has() {
    return this.#session.has;
  }

  get get() {
    return this.#session.get;
  }

  get flash() {
    return this.#session.flash;
  }

  get unset() {
    this.isPending = true;
    return this.#session.unset;
  }

  get set() {
    this.isPending = true;
    return this.#session.set;
  }

  destroy() {
    return this.#sessionStorage.destroySession(this.#session);
  }

  commit() {
    this.isPending = false;
    return this.#sessionStorage.commitSession(this.#session);
  }
}

const CART_QUERY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    discountAllocations {
      discountedAmount {
        ...Money
      }
      ... on CartCodeDiscountAllocation {
        code
      }
      ... on CartAutomaticDiscountAllocation {
        title
      }
      ... on CartCustomDiscountAllocation {
        title
      }
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    sellingPlanAllocation {
      sellingPlan {
        id
        name
        description
        recurringDeliveries
        options {
          name
          value
        }
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height

        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
  fragment CartLineComponent on ComponentizableCartLine {
    id
    quantity
    attributes {
      key
      value
    }
    discountAllocations {
      discountedAmount {
        ...Money
      }
      ... on CartCodeDiscountAllocation {
        code
      }
      ... on CartAutomaticDiscountAllocation {
        title
      }
      ... on CartCustomDiscountAllocation {
        title
      }
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
        requiresComponents
        components(first: 10) {
          nodes {
            productVariant {
              id
              title
              product {
                handle
              }
            }
            quantity
          }
        }
      }
    }
  }
  fragment CartApiQuery on Cart {
    updatedAt
    id
    appliedGiftCards {
      id
      lastCharacters
      amountUsed {
        ...Money
      }
    }
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      nodes {
        ...CartLine
        ...CartLineComponent
      }
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
      totalDutyAmount {
        ...Money
      }
      totalTaxAmount {
        ...Money
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
` as const;

const CART_MUTATE_FRAGMENT = CART_QUERY_FRAGMENT.replace(
  "fragment CartApiQuery on Cart",
  "fragment CartApiMutation on Cart",
).replace("lines(first: $numCartLines)", "lines(first: 250)");
