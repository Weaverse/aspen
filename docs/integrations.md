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

4. Restart `npm run dev`. The product page and cart show:
   - guests: estimated points for the current price (theme rate)
   - signed-in customers: live `points_approved` + estimated earn

The hint is hidden when LoyaltyLion is not configured **and** Weaverse **Show
loyalty points hint** is off.

Live points are loaded in the root deferred loader via
`app/utils/loyaltylion.server.ts` (`GET /headless/2025-06/{siteId}/customers/{gid}`).
A guest or missing LoyaltyLion customer falls back to the estimate only.

Uninstall Rivo if it is still installed — Aspen no longer calls it.

## Judge.me reviews

Set `JUDGEME_PRIVATE_API_TOKEN` (private). Reviews load through
`app/utils/judgeme.ts` and `/api/review/:handle`. The token is never returned
to the browser.

## Wishlist

See [customer-wishlist-setup.md](./customer-wishlist-setup.md).
