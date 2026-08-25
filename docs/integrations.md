# Third-party integrations

Aspen exposes integration-ready storefront surfaces. Vendor tokens stay on
the server. Client code only receives booleans such as `integrations.klaviyo`
and `integrations.loyaltyLion` from the root loader — never private tokens.

## Klaviyo

Set `KLAVIYO_PRIVATE_API_TOKEN` in `.env` (and Oxygen). Do not prefix it with
`PUBLIC_`.

### Newsletter

Footer and popup forms POST to `/api/klaviyo`. Duplicate emails return success.

The Weaverse newsletter section still posts to `/api/customer`. Point it at
`/api/klaviyo` before using it in production.

### Contact form

Add the **Contact form** section to a Weaverse page to enable the UI. It POSTs
to `/api/contact`, which records a `Contact Form Submission` event through
Klaviyo's server-side Events API. The private API key must include the
`events:write` scope.

This event creates or updates the Klaviyo profile identified by the submitted
email, but it does not subscribe that profile to a marketing list. Newsletter
consent must continue to use the newsletter integration. Missing configuration
and upstream failures return a generic safe message to the storefront; private
tokens and Klaviyo error payloads are never returned to the browser. The route
also rejects non-POST and cross-origin submissions.

### Back in stock

When a selected variant is sold out, the product page and quick shop can show
a notify form. The form is hidden when:

- the variant is available
- Klaviyo is not configured
- the merchant turned the Weaverse switch off (`Show back-in-stock form`)

Setup:

1. Connect Shopify in Klaviyo so the catalog syncs.
2. Create an active **Back in Stock** flow.
3. Confirm the Shopify catalog has finished syncing in Klaviyo. A 404
   `variant_not_found` in server logs means the variant is not in that catalog
   yet.
4. Turn off **Continue selling when out of stock** on products that should
   notify shoppers.
5. Keep `KLAVIYO_PRIVATE_API_TOKEN` on the server.

The API route is `/api/back-in-stock`. It sends the Shopify numeric variant ID
as `$shopify:::$default:::VARIANT_ID`. Klaviyo error payloads stay server-side.
The starter validates same-origin POST requests and their submitted values, but
does not include an in-memory rate limiter because Oxygen instances do not
share module state. Merchants that need additional abuse protection should
configure Turnstile, a WAF, or rate limiting provided by their deployment
platform.

## Loyalty (LoyaltyLion)

Use **LoyaltyLion**, not a Liquid widget app. It has a documented Hydrogen
Headless API. Theme app embeds will not render on this storefront.

Headless API access is on LoyaltyLion **Plus**. After installing the Shopify
app:

1. Open LoyaltyLion admin. Site ID is the number after `/sites/` in the URL
   (`https://app.loyaltylion.com/sites/123` → `123`).
2. Create an API key: **Settings → Developer → API keys** (Headless / API key,
   not the legacy token+secret pair).
3. Add to `.env` and Oxygen — do **not** prefix `PUBLIC_`:

```
LOYALTYLION_SITE_ID="123"
LOYALTYLION_API_KEY="your-loyaltylion-api-key"
```

4. Restart `npm run dev`. The product page and cart show signed-in customers
   their live `points_approved` balance.

Earning rules live in the LoyaltyLion admin, so the theme never estimates an
earn amount while LoyaltyLion is connected — showing a theme-configured rate
would contradict the points actually awarded. **Points per currency unit** is
therefore ignored once LoyaltyLion is connected; it only drives the estimate
for stores running no loyalty vendor.

Because of that, a guest sees no hint while LoyaltyLion is connected: there is
no balance to read and no trustworthy rate to estimate from. To surface a guest
earn estimate you would have to read earning rules from LoyaltyLion.

The hint is hidden when LoyaltyLion is not configured **and** Weaverse **Show
loyalty points hint** is off.

Live points are loaded in the root deferred loader via
`app/utils/loyaltylion.server.ts` (`GET /headless/2025-06/{siteId}/customers/{gid}`).
This call is not cached, and every lookup failure degrades silently to "no
points" — check server logs if a configured store shows no balance.

Uninstall Rivo if it is still installed — Aspen no longer calls it.

## Judge.me reviews

Set `JUDGEME_PRIVATE_API_TOKEN` (private). Reviews load through
`app/utils/judgeme.ts` and `/api/review/:handle`. The token is never returned
to the browser.

## Wishlist

See [customer-wishlist-setup.md](./customer-wishlist-setup.md).
