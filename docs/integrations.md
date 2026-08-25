# Third-party integrations

This guide describes Aspen's integration surfaces, credential boundaries, and
local/Oxygen setup. It deliberately separates features already implemented in
Aspen from services that still require an adapter.

> A Shopify theme app embed or Liquid snippet does not automatically run in a
> Hydrogen storefront. Install the Shopify app to create its Shopify-side data,
> then use a Hydrogen-compatible API, SDK, or Aspen adapter to render it.

## Support matrix

| Category | Provider | Aspen status | Storefront surface |
| --- | --- | --- | --- |
| Reviews | Judge.me | **Built in** | Main product rating and review block; standalone **Judgeme Reviews** section |
| Reviews | Yotpo, Okendo, Loox | **Adapter required** | Replace or extend the product rating/review loader and renderer |
| Email and back in stock | Klaviyo | **Built in** | Footer, newsletter popup, **Newsletter**, **Contact form**, product page, and quick shop |
| SMS | Attentive | **Adapter required** | Newsletter/contact consent UI or a dedicated Weaverse section |
| Subscriptions | Recharge, Skio, Appstle | **Shopify selling-plan compatible** | Main product, quick shop, cart; provider portal/API features require an adapter |
| Wishlist | Aspen customer wishlist | **Built in** | Product cards and Main product |
| Wishlist | Third-party wishlist apps | **Adapter required** | Product cards, Main product, account/wishlist page |
| Loyalty | LoyaltyLion | **Built in** | Signed-in customer points hint on Main product and cart |
| Loyalty/referrals | Other apps | **Adapter required** | Header/account, Main product, cart, referral landing page |
| Search/filter | Shopify Storefront API + Search & Discovery | **Built in** | Search, predictive search, collection filters |
| Search/merchandising | External providers | **Adapter required** | Search/collection route loaders and result components |
| Analytics | Hydrogen Analytics + GTM bridge | **Built-in foundation** | Root analytics provider and standard storefront events |
| Analytics/pixels | GA4, Meta, Google Ads, other pixels | **Configuration or adapter required** | GTM client tags and, when required, server event routes |

“Adapter required” means that adding an environment variable alone does
nothing. Code must be added to call the provider and render or forward its
data.

## Credential and environment rules

### Public versus private

Use `PUBLIC_` only when a value is intentionally sent to the browser.

| Credential type | Browser-safe? | Aspen handling |
| --- | --- | --- |
| Store/widget ID, public app key, public storefront token | Usually, but only when the provider explicitly documents it as public | May use `PUBLIC_`; restrict scopes and origins where supported |
| Private API key, app secret, admin token, webhook signing secret | **No** | Server environment only; never return it from a loader/action |
| Customer access token, email, phone, order/customer data | **No** | Keep server-side or in the provider's approved client flow; never log raw values |

Do not put private values in Git, Weaverse section settings, theme settings,
client bundles, `window`, HTML attributes, screenshots, or support tickets.
Prefer a server loader/action and return only the fields needed by the UI.
[Weaverse loaders support server-side third-party fetching and Hydrogen
caching](https://docs.weaverse.io/features/why-weaverse-for-hydrogen).

### Local and Oxygen setup

Local development reads `.env` in the repository root. Keep `.env` untracked,
use placeholder-only values in `.env.example`, and restart the dev server after
changing a value.

Production and preview deployments read variables from Shopify admin:

1. Open **Hydrogen > Storefronts > Aspen > Environments and variables**.
2. Add each value to the correct Preview and/or Production environment.
3. Redeploy that environment after changing a variable.
4. Set independent credentials for staging and production when the provider
   supports separate apps, sites, or workspaces.

See [Weaverse's Oxygen deployment guide](https://docs.weaverse.io/oxygen-deployment)
for the global deployment workflow.

### Environment examples

These are placeholders, not working credentials:

```dotenv
# Implemented by Aspen
JUDGEME_PRIVATE_API_TOKEN="<judgeme-private-api-token>"
KLAVIYO_PRIVATE_API_TOKEN="<klaviyo-private-api-token>"
LOYALTYLION_SITE_ID="<loyaltylion-site-id>"
LOYALTYLION_API_KEY="<loyaltylion-headless-api-key>"
PUBLIC_GOOGLE_GTM_ID="GTM-XXXXXXX"

# Adapter examples only — Aspen does not read these names today
PUBLIC_YOTPO_APP_KEY="<yotpo-public-app-key>"
YOTPO_APP_SECRET="<yotpo-private-app-secret>"
OKENDO_USER_ID="<okendo-user-id>"
OKENDO_API_KEY="<okendo-private-api-key>"
PUBLIC_LOOX_STORE_ID="<loox-public-store-id>"
LOOX_MERCHANT_API_KEY="<loox-private-merchant-api-key>"
ATTENTIVE_API_KEY="<attentive-private-api-key>"
ATTENTIVE_SIGNUP_SOURCE_ID="<attentive-sign-up-source-id>"
RECHARGE_STOREFRONT_TOKEN="<recharge-scoped-storefront-token>"
RECHARGE_ADMIN_TOKEN="<recharge-private-admin-token>"
```

Do not invent a `PUBLIC_` variable for Skio, Appstle, or another provider until
its chosen API/SDK explicitly classifies that credential as browser-safe.

## Reviews

### Judge.me — built in

**Where it appears**

- Main product can show the star summary and one review block.
- The standalone **Judgeme Reviews** section can be placed where a separate
  review experience is needed.
- Review data is fetched through `app/utils/judgeme.ts` and
  `/api/review/:productHandle`; review submission uses the product route
  action. The private token is not returned to the browser.

**Setup**

1. In Judge.me, open **Settings > Integrations > View API tokens**.
2. Copy the **private** API token into `JUDGEME_PRIVATE_API_TOKEN` locally and
   in Oxygen. Judge.me distinguishes public widget/GET credentials from the
   private token; Aspen's current server integration uses the private token.
3. Restart or redeploy, open a product with reviews, and enable the review
   settings in Main product or add the standalone section.

Official reference: [Judge.me API tokens](https://judge.me/help/en/articles/8409180-using-judge-me-api).

**Test**

- Configured: rating, review count, pagination, and review submission work on a
  reviewed product; confirm the token is absent from page source and network
  response bodies.
- Unconfigured: the storefront renders an empty/no-reviews state without
  exposing an exception. Confirm product purchase remains usable.
- Do not place both Main product's review block and the standalone review
  section on the same PDP unless duplicate review UIs are intentional.

### Yotpo — adapter required

Use the Yotpo App Key/Store ID only as public widget configuration when Yotpo
documents that usage. Keep the Secret Key server-only. Yotpo lists both under
**Account Settings > General Settings**; generating a secret requires an
authorized account.

Implementation pattern:

1. Add a server utility/loader that maps Shopify product IDs or handles to
   Yotpo product identifiers.
2. Return normalized rating/review fields to Aspen's existing review UI, or
   implement a provider-specific section.
3. Add the required script, API, and image hosts to `app/weaverse/csp.ts` only
   after confirming the exact production domains.
4. Keep moderation, review creation, and write APIs on the server.

References: [find the Yotpo App Key and Secret](https://support.yotpo.com/docs/finding-your-yotpo-app-key-and-secret-key-4)
and [Yotpo custom storefront integration](https://support.yotpo.com/v1/docs/generic-other-platforms-installing-yotpo-reviews-v3).

### Okendo — adapter required

Okendo documents a Widget Plus installation for Hydrogen/headless storefronts.
For a custom server integration, get the Merchant API User ID and API Key from
Okendo integration settings and keep the API key server-only. Do not call the
Merchant REST API directly from the browser.

Choose one approach and avoid loading both:

- Widget Plus/headless SDK for Okendo's UI; or
- Aspen server loader using Okendo Storefront/Merchant APIs and Aspen's UI.

References: [Okendo headless Widget Plus](https://docs.okendo.io/on-site/advanced-widget-installs/installing-widget-plus-on-headless-instances),
[Storefront reviews API](https://docs.okendo.io/on-site/storefront-rest-api/endpoints/reviews),
and [Merchant API credentials](https://docs.okendo.io/merchant-rest-api/quick-start).

### Loox — adapter required

Loox's Storefront API uses a public Store ID and is intended for public review
data. Its Merchant API key is private and must be used only by an Aspen server
loader/action. Obtain keys from Loox **Settings > API Keys**.

References: [Loox APIs and key boundaries](https://help.loox.io/support/solutions/articles/501000356871-loox-reviews-api-and-webhooks)
and [Loox with Shopify headless commerce](https://help.loox.io/support/solutions/articles/501000162379-integrating-loox-with-shopify-headless-commerce).

For every review adapter, test a product with reviews, a product without
reviews, a bad product mapping, a rate-limited response, and a missing token.
Use a short cache for public review reads; do not cache writes.

## Email, SMS, and back in stock

### Klaviyo — built in

Set `KLAVIYO_PRIVATE_API_TOKEN` in local `.env` and each Oxygen environment.
Create the key in Klaviyo **Settings > API Keys** using the minimum custom
scopes. Never prefix it with `PUBLIC_` or expose it from root data.

| Aspen surface | Route | Minimum purpose/scope |
| --- | --- | --- |
| Footer, newsletter popup, **Newsletter** section | `/api/klaviyo` | Create/update a profile; `profiles:write` |
| **Contact form** section | `/api/contact` | Record `Contact Form Submission`; `events:write` |
| Main product and quick-shop back-in-stock form | `/api/back-in-stock` | Create back-in-stock subscription; catalog and profile write scopes required by Klaviyo |

The root loader exposes only `integrations.klaviyo: boolean`. The newsletter
form posts to Klaviyo but does not add the profile to a marketing list. If a
specific list is required, add explicit consent copy and a server-side list
subscription implementation; do not silently change contact submissions into
marketing consent.

Back-in-stock setup:

1. Connect Shopify and wait for the Klaviyo catalog sync.
2. Create and activate a Back in Stock flow.
3. Disable **Continue selling when out of stock** for variants that should show
   the form.
4. Enable **Show back-in-stock form** in the relevant Weaverse product section.

The form remains hidden when the variant is available, the setting is off, or
Klaviyo is unconfigured. Test all three states, a duplicate newsletter email,
an invalid email, a sold-out variant, and a provider failure. A
`variant_not_found` response usually means catalog sync or ID mapping is not
ready.

References: [create a Klaviyo private API key](https://help.klaviyo.com/hc/en-us/articles/7423954176283)
and [Klaviyo back-in-stock API](https://developers.klaviyo.com/en/v2024-07-15/reference/create_back_in_stock_subscription).

### Attentive — adapter required

Attentive SMS consent must not reuse a generic email checkbox. Create an
Attentive custom app in **Marketplace**, grant only the required permissions,
and keep its API key server-only. The Subscribers API also requires an approved
`signUpSourceId` and legally compliant disclosure text.

Recommended Aspen pattern:

1. Add a dedicated SMS field/checkbox or section with the exact disclosure
   approved for the program.
2. POST to an Aspen action; validate origin, phone format, and consent fields.
3. Call Attentive from the server and return a generic success/error state.
4. Keep email and SMS consent records separate.

Test opt-in, invalid phone, duplicate subscriber, unchecked consent, missing
configuration, and provider failure. Ask the Attentive team to review the final
disclosure before launch.

References: [build an Attentive custom app](https://help.attentivemobile.com/hc/en-us/articles/4412840747540-Build-an-app-to-connect-with-Attentive-s-APIs),
[Attentive APIs](https://help.attentivemobile.com/hc/en-us/articles/360062103592-Attentive-s-APIs),
and [legal disclosure guidance](https://docs.attentivemobile.com/pages/legal-docs/legal-disclosure-language/).

## Subscriptions

Aspen already queries Shopify `sellingPlanGroups`, renders a selector on Main
product and quick shop, sends `sellingPlanId` when adding a cart line, and
shows the `sellingPlanAllocation` in cart. The purchase flow therefore needs no
provider token when Recharge, Skio, or Appstle creates standard Shopify selling
plans for the product.

The Headless channel/custom app must include
`unauthenticated_read_selling_plans`. See Shopify's [selling-plan storefront
guide](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/subscriptions).

| Provider | Purchase selector | Customer portal, bundles, migrations, provider data |
| --- | --- | --- |
| Recharge | Uses Shopify selling plans | Use Recharge's Hydrogen Storefront SDK/API or a server adapter; private Admin API tokens stay server-side |
| Skio | Uses Shopify selling plans | Follow Skio's Hydrogen guide; its customer portal is commonly loaded through Shopify App Proxy/approved iframe flow |
| Appstle | Uses Shopify selling plans | Use Appstle customer-facing App Proxy APIs or a server integration for external/admin APIs |

For Aspen's existing purchase selector, the required provider credential is
**none**: create and assign plans in the provider's Shopify app admin. If an
additional provider feature is implemented:

- Recharge merchants create scoped tokens under **Tools & apps > API tokens**.
  A Storefront token may be used only according to Recharge's documented SDK
  boundary; an Admin API token is always server-only.
- Skio's documented Hydrogen portal uses its Shopify App Proxy/portal flow, so
  do not invent an Aspen API token for the standard portal. Request provider
  credentials from Skio only when the selected custom API requires them.
- Appstle customer-facing APIs use its Shopify App Proxy. External/admin API
  credentials, if used, must be obtained from the Appstle merchant/developer
  integration and kept server-only.

Store any private credential needed by a custom adapter in local `.env` and in
the corresponding Oxygen environment under the same name. No provider secret
belongs in a Weaverse setting.

Provider references:

- [Recharge Storefront API and JS SDK](https://docs.getrecharge.com/docs/storefront-api-and-js-sdk)
  and [Recharge API key security](https://docs.getrecharge.com/docs/recharge-api-key)
- [Skio Hydrogen integration](https://help.skio.com/docs/onboarding-integrating-on-hydrogen-remix)
- [Appstle subscription APIs](https://developers.subscription.appstle.com/)

Do not persist selling-plan IDs in Weaverse settings or source code; providers
can recreate them. Query current IDs from Shopify with the product. Test
one-time purchase, each frequency, a subscription-only product, quick shop,
cart updates, checkout, and the provider's post-purchase portal. With the app
uninstalled or no plan assigned, Aspen must render the normal one-time purchase
flow without an empty selector.

## Wishlist apps

Aspen's default wishlist is native and needs no third-party key. It stores
Shopify product GIDs in the signed-in customer's Customer Account metafield
`custom.aspen_wishlist`, read and written through `/api/wishlist`. Product cards
and Main product use the shared wishlist provider. Local/Studio preview uses a
preview cookie; production uses Customer Account authentication.

Follow [customer wishlist setup](./customer-wishlist-setup.md) before testing
real accounts.

For Swym, Growave, Wishlist Plus, or another wishlist provider, implement a
shared adapter rather than adding a second independent heart button:

1. Normalize add, remove, contains, and list operations around Shopify product
   GIDs/variant GIDs.
2. Perform private customer/list lookups on the server.
3. Replace the shared wishlist provider so cards and PDP remain synchronized.
4. Define how guest items merge after login and how deletion/account privacy
   requests are handled.

Test guest, signed-out, signed-in, duplicate add, remove, cross-device sync,
provider outage, and missing configuration. The unconfigured adapter must
either fall back to Aspen's native wishlist or hide wishlist controls—never
show a control that loses data.

## Loyalty and referrals

### LoyaltyLion — built in

LoyaltyLion's Headless API supports Shopify Hydrogen. Aspen reads signed-in
customer points from a root server loader and exposes only a configured boolean
and the resulting balance—not the API key.

1. Get the site ID from the LoyaltyLion site URL/admin.
2. Create a Headless API key in LoyaltyLion developer settings. Headless API
   authentication supports API keys/OAuth, not the legacy token/secret pair.
3. Set `LOYALTYLION_SITE_ID` and `LOYALTYLION_API_KEY` locally and in Oxygen.
4. Enable/configure the loyalty hint in Weaverse theme settings.

Earning rules remain authoritative in LoyaltyLion. When it is configured,
Aspen does not estimate points from the theme's fallback points-per-currency
setting. Guests have no live customer balance, so the vendor-backed hint is
hidden until sign-in. Request failures degrade to no points and are logged on
the server.

References: [LoyaltyLion Headless API](https://developers.loyaltylion.com/headless-api/introduction)
and [get a Headless customer](https://developers.loyaltylion.com/headless-api/2025-06/customers/get-customer).

### Other loyalty/referral apps — adapter required

Use the same pattern for Yotpo Loyalty, Smile, ReferralCandy, or another app:
authenticate on the server, map Shopify Customer Account GIDs to the provider's
customer ID, and return only display data. Reward redemption and referral
creation are writes and must use authenticated server actions with CSRF/origin
validation.

Test guest, customer with zero points, customer with rewards, invalid mapping,
expired credentials, and provider outage. Hide or fall back to neutral copy
when unconfigured; never estimate a live vendor balance from theme settings.

## Search, filters, and merchandising

Aspen's default search, predictive search, and collection filters use Shopify
Storefront API data. Configure available filters in the Shopify **Search &
Discovery** app; no third-party credential is required. Shopify documents that
custom storefront filters are returned through Storefront API product
connections: [filter products in a collection](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/filter-products).

For Algolia, Searchspring, Boost, Klevu, or another service, adding its crawler
or Shopify app is not enough. The Aspen adapter should:

- query the provider from search and collection route loaders, preferably on
  the server;
- map hits to Aspen product-card fields and canonical Shopify product URLs;
- preserve locale, currency, availability, selected filters, pagination, and
  URL state;
- keep indexing/admin secrets server-only and use only a restricted public
  search key in the browser when the provider requires client search;
- define a Shopify fallback for missing configuration or provider outage;
- update `app/weaverse/csp.ts` for the smallest verified set of API/script/image
  hosts.

Test zero results, typo/predictive search, every filter type, sorting,
pagination/load more, Markets currency/language, unpublished products, stale
index data, missing credentials, and outage fallback.

## Analytics and pixels

Aspen wraps the storefront with Hydrogen `Analytics.Provider` and subscribes to
standard events in `app/components/root/custom-analytics.tsx`. When
`PUBLIC_GOOGLE_GTM_ID` is set, it loads GTM and pushes selected Aspen events to
`window.dataLayer`. The current bridge is a foundation: it does not by itself
configure GA4 ecommerce tags, Meta Pixel/CAPI, Google Ads conversions, or
server-side deduplication.

### Credential boundary

- Browser-safe: GTM container ID, GA4 measurement ID, Meta Pixel ID, Google Ads
  conversion ID/label. These identify a destination but are not authorization
  secrets.
- Server-only: GA4 Measurement Protocol API secret, Meta CAPI access token,
  Google Ads OAuth credentials/developer token, webhook signing secrets.
- Never include email, phone, customer tokens, or raw addresses in
  `dataLayer`. Hashing personal data does not remove consent requirements.

### Implementation pattern

1. Configure Shopify customer privacy and ensure analytics/marketing events are
   gated by the correct consent state. Hydrogen's
   [analytics and consent guide](https://shopify.dev/docs/storefronts/headless/hydrogen/analytics/consent)
   explains the domain and privacy-banner requirements.
2. Add client tags in GTM or an Aspen component only for consented browser
   events.
3. Add an Oxygen server endpoint for Measurement Protocol/CAPI/enhanced
   conversions. Keep secrets there, validate requests, and forward a stable
   `event_id` for browser/server deduplication.
4. Add only required vendor domains to `app/weaverse/csp.ts`.
5. Audit checkout tracking separately because checkout runs on Shopify's
   domain. Avoid firing the same purchase from both Shopify pixels and Aspen
   without deduplication.

Official implementation references:

- [Shopify Web Pixels API](https://shopify.dev/docs/api/web-pixels-api)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Meta Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Google Ads enhanced conversions for web](https://developers.google.com/google-ads/api/docs/conversions/enhanced-conversions-for-web)

Test with consent accepted, rejected, and changed; an ad blocker; client
navigation; cart add/remove; checkout; order completion; duplicated event IDs;
and missing config. With no GTM ID, Aspen must omit the GTM script and preserve
normal storefront behavior.

## Integration QA checklist

For every provider:

- [ ] Placeholder-only examples are committed; actual credentials exist only
      in local `.env` and the correct Oxygen environments.
- [ ] Public/private classification was confirmed in current provider docs.
- [ ] Private values are absent from built assets, HTML, loader JSON, network
      responses, logs, Weaverse settings, and screenshots.
- [ ] Configured state works with production-like data.
- [ ] Missing, invalid, expired, and insufficient-scope credentials fail
      safely.
- [ ] Empty data and provider outage do not block product purchase or page
      rendering.
- [ ] Consent, privacy, data deletion, and regional requirements are tested.
- [ ] CSP allows only required production domains.
- [ ] Preview and Production Oxygen variables are configured independently and
      both deployments were tested.

## Troubleshooting

### Works locally but not on Oxygen

- Confirm the variable exists in the exact Preview/Production environment.
- Check spelling and case; private variables must not gain a `PUBLIC_` prefix.
- Redeploy after changing variables.
- Compare provider app/site/workspace IDs between local and production.
- Check Oxygen logs for upstream status codes without logging tokens or PII.

### App is installed in Shopify but nothing appears

Liquid blocks and theme app embeds target Online Store themes, not Hydrogen.
Verify that the provider supports headless storefronts, then implement or
enable the Aspen API/SDK adapter described above.

### Browser reports a CSP error

Add only the verified provider origin to the appropriate directive in
`app/weaverse/csp.ts` (`scriptSrc`, `connectSrc`, `imgSrc`, or `frameSrc` as
required). Test Studio design mode and the production domain. Do not use `*` as
a production workaround.

### Provider returns unauthorized or forbidden

- Verify token type, scopes, site/store ID, environment, expiry, and API
  version.
- Ensure a private token is being sent only by the Oxygen server.
- Rotate a token immediately if it appeared in browser tools or Git history.

### Configured integration shows empty data

- Confirm Shopify IDs, handles, GIDs, catalog sync, customer mapping, locale,
  and publication status.
- Test the provider endpoint with a known reviewed/subscribed/customer product.
- Check caching before assuming the upstream write failed.

### Studio preview differs from production

Studio can use preview data/cookies for account-dependent surfaces. Verify the
real page on a deployed preview with actual Customer Account authentication and
the Preview environment's credentials. See the project [setup guide](./setup.md)
for Studio and Oxygen connection details.

## Global references

- [Weaverse third-party server-loader pattern](https://docs.weaverse.io/features/why-weaverse-for-hydrogen)
- [Weaverse deployment overview](https://docs.weaverse.io/deployment)
- [Weaverse Oxygen deployment](https://docs.weaverse.io/oxygen-deployment)
- [Shopify Hydrogen third-party API cookbook](https://shopify.dev/docs/storefronts/headless/hydrogen/cookbook)
