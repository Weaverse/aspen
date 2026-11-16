/// <reference types="vite/client" />
/// <reference types="@shopify/oxygen-workers-types" />

// Enhance TypeScript's built-in typings.
import "@total-typescript/ts-reset";
import type {
  WeaverseClient,
  WeaverseEnv,
} from "@weaverse/hydrogen/react-router";
import type { Storefront as StorefrontBase } from "./app/.server/storefront";
import type { I18nLocale, StoreLocalization } from "./app/types/locale";
import type { createAppLoadContext } from "./server";

declare global {
  /**
   * A global `process` object is only available during build to access NODE_ENV.
   */

  interface Env extends WeaverseEnv {
    SESSION_SECRET: string;
    PUBLIC_STORE_DOMAIN: string;
    PUBLIC_STOREFRONT_API_TOKEN?: string;
    PRIVATE_STOREFRONT_API_TOKEN?: string;
    PUBLIC_STOREFRONT_ID?: string;
    PUBLIC_CHECKOUT_DOMAIN?: string;
    SHOP_ID?: string;
    PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID?: string;
    // declare additional Env parameter use in the fetch handler and Remix loader context here
    PUBLIC_GOOGLE_GTM_ID: string;
    JUDGEME_PRIVATE_API_TOKEN: string;
    CUSTOM_COLLECTION_BANNER_METAFIELD: string;
    METAOBJECT_COLORS_TYPE: string;
    METAOBJECT_COLOR_NAME_KEY: string;
    METAOBJECT_COLOR_VALUE_KEY: string;
    KLAVIYO_PRIVATE_API_TOKEN: string;
    LOYALTYLION_SITE_ID: string;
    LOYALTYLION_API_KEY: string;
    PUBLIC_SHOPIFY_INBOX_SHOP_ID: string;
    WEAVERSE_HOST?: string;
  }

  interface HydrogenAdditionalContext {
    weaverse: WeaverseClient;
    localization: StoreLocalization;
  }
}

declare module "react-router" {
  interface AppLoadContext
    extends Awaited<ReturnType<typeof createAppLoadContext>> {
    // to change context type, change the return of createAppLoadContext() instead
    weaverse: WeaverseClient;
  }

  // TODO: remove this once we've migrated our loaders to `Route.LoaderArgs`
  interface LoaderFunctionArgs {
    context: AppLoadContext;
  }

  // TODO: remove this once we've migrated our loaders to `Route.ActionArgs`
  interface ActionFunctionArgs {
    context: AppLoadContext;
  }

  interface RouterContextProvider
    extends Awaited<ReturnType<typeof createAppLoadContext>> {}

  interface SessionData {
    // declare local additions to the Remix session data here
  }
}

declare global {
  interface Window {
    dataLayer: any[];
  }
}
