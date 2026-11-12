# Aspen Hydrogen 2026.10 migration

Aspen now uses Hydrogen 2026.10 and Weaverse v6. The migration keeps Aspen's
section schemas, presets, merchant content and responsive presentation.

## Development and deployment

- Use Node `^22.18.0 || ^24.11.0` and `npm ci`.
- `npm run dev` starts Vite with MiniOxygen on port 3456.
- `npm run dev:https` enables local HTTPS for Customer Account OAuth;
  `npm run dev:ca` is retained as an alias. Register the HTTPS callback URL
  in Shopify's Customer Account API configuration.
- `npm run typecheck` checks React Router types, TypeScript and GraphQL documents.
  GraphQL codegen and the old generated declaration files have been removed.
- `npm run build` writes `dist/client` and `dist/server`.
- `npm run deploy -- --preview` deploys to Oxygen Preview after the project has
  been linked to the intended Aspen Hydrogen storefront. No environment
  credentials are changed by this code migration.

## Aspen-specific compatibility

Pilot provides the request lifecycle, typed query, customer account, product
form, collection-store and analytics patterns. Aspen keeps its own rendering
and its queued cart mutation controls. The app-owned `/cart` action executes
standard mutations through Hydrogen's cart handlers, with explicit GraphQL
operations for gift cards and buyer identity. `CartLibrarySync` reconciles
successful custom actions into Hydrogen's cart/analytics store. The root's
personalized cart, wishlist and account data stay private when the request
carries a cart or session cookie.

Storefront queries declare cache policies and unwrap GraphQL errors. Admin API
queries for inventory and combined listings stay server-side and use Hydrogen's
`createRunWithCache`, including negative caching. Weaverse receives the public
market locale separately from the request's Storefront client.

Image, money, pagination and SEO helpers are local ports of the removed classic
helpers. Prices keep Aspen's locale-aware formatting. Collection filters and
sort use the library store and Liquid-compatible parameters; old browse URLs
redirect while preserving unrelated campaign parameters. Search keeps Aspen's
visible-listing pagination and bounded facet probes.

## Verification record

Verified locally on 2026-11-12 with Node 22.23.0:

- A clean `npm ci --engine-strict --no-audit --no-fund` using npm 10.9.8.
- `npm run typecheck`, including GraphQL validation, and `npm run build`.
- Biome with no errors (non-blocking lint warnings remain), and `git diff --check`.
- All 30 TypeScript unit files: 179 tests, including the added cart-removal
  regression. Separate search tests (17) and sanitizer runtime tests (3) pass.
- Vite/MiniOxygen dev startup, worker SSR, client transforms and dependency
  optimization, including the missing-session-secret guard.
- Production-preview browser checks at desktop (1440px) and mobile (390px):
  product add, quantity update, persistence after reload, removal, private page
  cache headers with a cart cookie, and no client exceptions.
- Eleven focused browser suites (66 tests) pass. They cover product quantity,
  swatches and galleries;
  cart quantity, loading, nested dialogs and shared-inventory races; featured
  products; video Quick Add; Quick Shop/cart handoff; and collection controls.
  Fixtures use the v6 entry points and local replacement helpers. Collection
  assertions use `sort_by`/`filter.v.*`; search assertions retain Aspen's URL
  contract.
- Client navigation to the French market updates Shopify's locale, country,
  currency and route root. Home, search, all-products and collections respond
  successfully; unsupported-market pages/resources answer 404, and old sort
  URLs redirect with campaign parameters preserved.

The cart-removal regression was first reproduced against the incorrect gateway
payload, then passed after mapping removals to zero-quantity `lines`, as required
by Hydrogen's JSON cart handler.

Additional account and Studio verification:

- Eleven account integration tests cover HTTPS OAuth login, PKCE, signed
  cookies, safe return URLs, callback state rejection, callback token exchange,
  refresh, same-origin logout protection, cart customer-identity reconciliation and
  preservation of order keys through login redirects. HTTPS local account pages
  exercise real authentication; automatic fixture previews stay on HTTP localhost
  and in Studio design mode.
  Shopify token responses are fixtures; these tests do not represent a live OTP
  sign-in. Transient refresh failures preserve the cart; definitive failures and
  logout detach the customer, expiring the cart cookie if detachment fails.
- A queued cart mutation sends an explicit `customerAccessToken: null` when
  signed out, instead of leaving the previous customer's buyer identity attached.
- The actual Aspen project in Weaverse Studio was tested against this checkout
  on port 3460: section selection, inspector settings, heading updates, draft save,
  revalidation and persistence across a full Studio reload. The original heading
  `ACCOUNT` was restored and saved. Nothing was published. The active preview was
  restored to `http://localhost:3456`; an inactive `Migration QA (temporary)`
  preview pointing to `http://localhost:3460` remains available for review.
- A dev-worker HTTP check confirms that plain HTTP localhost still renders the
  account fixture, while forwarded HTTPS redirects an order deep link to login
  with its order key preserved. This verifies routing, not a live OTP sign-in.
- Live Shopify sign-in was deferred at the user's request. It still needs a
  registered HTTPS origin and a customer OTP.
  Plain HTTP is rejected by the SDK; an HTTP preflight with forwarded HTTPS
  generated the correct authorization redirect and signed cookie, but Shopify
  answered 406 to the scripted authorization request. This does not establish
  whether the callback is registered or whether live sign-in succeeds.

Post-review regressions are covered by the loader and account integration tests:

- Collection loaders always supply `COLLECTION_DEFAULT` when `sort_by` is absent
  or unsupported, including subsequent sale-page scans. Explicit sorts keep
  their original direction.
- Adding another facet retains category selections, campaign parameters and a
  single sort value. Category removal affects only the selected category.
- Missing-collection redirects remove modern and legacy cursors and terminate
  at 404 instead of redirecting to themselves.
- Cart token resolution distinguishes signed-out (`null`) from temporarily
  unavailable (`undefined`). Queued standard mutations and cart creation return
  a structured, translated retry error before changing the cart when refreshing
  fails transiently; they retain the customer binding and can succeed on retry.
- Real dev-worker requests now return 200 for `/collections/chairs`, its sale
  view and explicit sorting. Missing collections with either cursor redirect to
  a cursor-free URL and then return 404.

An Oxygen deployment was explicitly skipped at the user's request. No release
or tag has been created.
Before treating the issue as complete, verify an Aspen Oxygen Preview deployment,
Customer Account OAuth against its registered HTTPS origin, then publish a
release with these migration notes. Studio draft editing and persistence have
been verified locally against the migrated checkout, as recorded above.

## References

- [Pilot upgrade guide](https://github.com/Weaverse/pilot/blob/main/.guides/hydrogen-upgrades/upgrade-2026.4.7-to-2026.10.2.md)
- [Pilot cut-over spec](https://github.com/Weaverse/pilot/blob/main/.weaverse/specs/2026-10-29-hydrogen-2026-10-cut-over.md)
- [Weaverse v6 migration guide](https://weaverse.io/docs/migration-advanced/v6-migration)
- [Pilot #214](https://github.com/Weaverse/pilot/pull/214),
  [#215](https://github.com/Weaverse/pilot/pull/215),
  [#216](https://github.com/Weaverse/pilot/pull/216)
