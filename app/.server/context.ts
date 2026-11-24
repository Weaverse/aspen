import { WeaverseClient } from "@weaverse/hydrogen/react-router";
import { loadStoreLocalization } from "~/utils/localization.server";
import { components } from "~/weaverse/components";
import { getThemeSchema } from "~/weaverse/schema.server";
import { createAspenCart } from "./cart-gateway";
import { createCustomerAccount } from "./customer-account";
import { AppSession } from "./session";
import { createRequestStorefront } from "./storefront";

export async function createAppLoadContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  if (!env.SESSION_SECRET)
    throw new Error("SESSION_SECRET environment variable is not set");
  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open("hydrogen"),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);
  const storedCountry = session.get("marketCountry");
  const storefront = createRequestStorefront({
    request,
    env,
    cache,
    waitUntil,
    marketCountry:
      typeof storedCountry === "string" ? storedCountry : undefined,
  });
  const customerAccount = createCustomerAccount({
    env,
    request,
    session,
    storefront,
  });
  const localization = await loadStoreLocalization(storefront, request);
  const cart = createAspenCart({
    request,
    storefront,
    getCustomerAccessToken: customerAccount.getCartAccessToken,
  });
  const weaverse = new WeaverseClient({
    storefront,
    locale: localization.selectedLocale,
    env,
    cache,
    waitUntil,
    request,
    customerAccount,
    themeSchema: getThemeSchema(localization),
    components,
  });
  return {
    env,
    cache,
    waitUntil,
    session,
    storefront,
    customerAccount,
    localization,
    cart,
    weaverse,
  };
}
