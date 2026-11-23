# Themivo Wishlist & Alerts

Optional integration built into Aspen. It replaces the data source behind the
existing wishlist provider and buttons, using server-side REST calls and Aspen
UI. Without `WISHLIST_API_KEY`, Aspen uses its native customer wishlist.

This cookbook covers installing, porting, disabling, and removing the
integration. It follows [Pilot's cookbook format](https://github.com/Weaverse/pilot/tree/main/.guides/cookbooks).
Implementation: [PR #12](https://github.com/Weaverse/aspen/pull/12).
Requirements: [#7](https://github.com/Weaverse/aspen/issues/7) and
[#13](https://github.com/Weaverse/aspen/issues/13).

## Prerequisites

- A Shopify store with [Themivo Wishlist & Alerts](https://apps.shopify.com/themivo-wishlist-alerts)
  installed, connected to this storefront's Shopify configuration.
- API access and a key with **Read** and **Write** scopes in Themivo's
  **Developers → API keys**. Confirm the store's plan permits API access;
  this cookbook does not establish a particular plan entitlement.
- Working Storefront API credentials to hydrate products and variants, and
  Customer Account configuration for signed-in features. Follow
  [Aspen's customer wishlist setup](../docs/customer-wishlist-setup.md).
- A supported Node version and the package manager used by your checkout.
  The reference snapshot below uses Hydrogen 2026.4, Weaverse 5, and Node 22
  or 24. Read the target checkout's `package.json` before porting; this
  cookbook does not perform a Hydrogen/Weaverse migration.
- A test customer, a second customer for collaborators, and disposable
  products/lists. Do not use merchant customer data for trial writes.

Read the vendor's [headless guide](https://wishlist.themivo.com/docs/headless)
and [REST API](https://wishlist.themivo.com/docs/rest-api) before changing API
contracts. The API key can access every shopper's wishlist: it is a server
secret, never a browser credential.

## Setup

1. Add the key to the untracked local `.env`:

   ```dotenv
   WISHLIST_API_KEY="<themivo-read-write-key>"
   ```

   Keep `.env.example` placeholder-only. Do not prefix this variable with
   `PUBLIC_`, return it from a loader, or put it in Weaverse settings.
2. Restart with `npm run dev` (port 3456 in the reference snapshot).
   Set the secret separately in the target Oxygen Preview/Production
   environment and redeploy to enable it there.
3. In Themivo **Developers → Headless storefront → Allowed origins**, register
   each origin used for the public Appearance configuration, for example
   `http://localhost:3456` and the actual HTTPS deployment origin. One per
   line, no path. Allow up to a minute for vendor changes and 30 seconds for
   Aspen's config cache. REST requests authenticated on the server do not
   require browser CORS; Appearance is a separate public config request.
4. Enable the desired features in Themivo: Guest wishlists, Multiple lists,
   Sharing, Collaborators (requires signed-in customers and multiple lists),
   and optionally Save for later. A disabled feature must not be treated as
   a successful write. The vendor remains the authority for permissions.
5. Test a normal storefront URL, without `themivo-preview=1`. In Weaverse
   **Theme settings → Product cards → Wishlist appearance**, Aspen is the
   default visual style. Choose Themivo to follow its button appearance and
   placement. This choice changes presentation, not the active data provider.
6. For real customer login locally, use `npm run dev:ca` and register the
   resulting origin/callback/logout URLs with Shopify Customer Accounts.
   Native localhost/Studio preview cookies are not proof of real OAuth.

The REST integration does not need the vendor's storefront script. An optional
development-only widget comparison exists at `?themivo-preview=1` and
`/wishlist/preview` on localhost. It has separate browser identity and is not
the production integration or a signed-in REST acceptance test. Do not enable
both implementations as independent wishlist buttons.

## How It Works

1. `app/utils/root.server.ts` selects the provider once for the root wishlist
   load. `app/root.tsx` loads public Appearance and awaits a signed-in guest
   merge before committing the session. The shared `WishlistProvider` keeps
   cards, Quick View, product pages, and the header synchronized.
2. `themivo-wishlist.server.ts` calls
   `https://wishlist-edge.themivo.com/api/v1` with the server key. It converts
   Shopify GIDs to numeric ID strings at the adapter boundary. Shopper identity
   comes from the server's Customer Account session, or a UUID v4 stored in
   Aspen's signed HTTP-only session (`themivoGuest`). Never accept a shopper
   ID from browser input. Successful merge forgets the guest ID; failure
   leaves it available for retry.
3. The adapter uses bounded per-worker ETag snapshots and `If-None-Match` for
   wishlist reads, plus request-scoped reuse. Product cards consume the shared
   provider instead of fetching a wishlist per card. Hide rules are cached for
   three minutes. Product popularity counts are separate, briefly cached and
   budgeted calls; they are not the shopper's saved-item badge.
4. Existing `/api/wishlist` handles add/remove/list. With a key, it delegates
   to Themivo; without one, it retains native Customer Account/preview behavior.
   It validates product/variant relationships on the server. Buttons toggle
   the default list; other lists are managed in the wishlist UI.
5. Appearance comes from the server request to
   `https://wishlist-edge.themivo.com/storefront/v1/shops/{shop}/config?locale={locale}`
   with the storefront origin. It has a 30-second cache and is normalized
   separately from private wishlist data. A failed config read uses Aspen's
   UI defaults; it does not migrate data or change the provider.
6. Themivo errors (`feature_disabled`, `login_required`, `forbidden`,
   `rate_limited`, and unavailable responses) become UI states/errors.
   A provider outage never silently redirects writes to the native metafield.
   Rules from `GET /rules` hide buttons/prices, including compare-at prices.
7. Storefront product data is hydrated in batches by
   `themivo-products.server.ts`. A missing saved variant must not silently
   purchase another variant. Purchases use Aspen's Shopify cart, not a second
   cart implementation. Private wishlist HTML/data responses are not publicly
   cached; share/invite routes have no-referrer/noindex handling and analytics
   guards to avoid leaking tokens.

### Settings and surfaces

| Surface | Behavior |
| --- | --- |
| Product cards, including Featured Products | Existing card button; selected/displayed variant when Save by variant is on; Aspen or Themivo appearance |
| Main product, Featured Product, Quick View | Product-page button settings and selected variant; image/form placement as configured |
| Header | Aspen positions the entry; honors the count switch. Themivo's automatic Online Store header injection toggle is not a headless header visibility contract |
| Floating launcher | Follows its enable/position settings; no saved-item count |
| Wishlist | Drawer/Popup/Page, Grid/List, optional shopper layout switch, prices, Add to cart, Share, empty state and supported translations |
| Multiple lists | Signed-in creation, rename/delete, item moves, subject to list role and feature permissions |
| Sharing/collaborators | Aspen URLs; shared view is read-only; invitation acceptance requires a signed-in customer |
| Cart page | Optional Save for later for eligible lines; cart page and drawer display the saved list and can restore items |

Shopify theme selectors, app blocks, and vendor custom CSS do not automatically
apply to React UI. Sign in with Shop is not implemented as a separate identity
flow here. Admin analytics, POS, email delivery, and notification templates are
not storefront REST features. See [notification/domain checks](../docs/integrations.md#themivo-wishlist--alerts--optional)
for email links: verify links on the shop's primary domain and redirect there
to Aspen if needed, preserving product handles and query parameters. Adding a
redirect only on localhost cannot fix an email pointing to another host.

### Routes

These routes are registered under Aspen's existing locale prefix. Use
`usePrefixPathWithLocale`/the existing locale helpers; do not hardcode `/en-us`.

| Path | Responsibility | Without API key |
| --- | --- | --- |
| `/api/wishlist` | Existing provider endpoint; private list/add/remove and optional product-count query | Native endpoint remains functional |
| `/wishlist` | Lists, items, share/collaborator management | 404; there is no native replacement page in this snapshot |
| `/wishlist/shared/:token` | Server reads `GET /shared/{token}`; Aspen read-only page | Unavailable |
| `/wishlist/join/:token` | Signed-in invitation acceptance | Unavailable |
| `/api/wishlist/saved-cart` | Optional save/restore/discard; server identity and cart cookie updates | Unavailable |
| `/wishlist/preview` | Local development widget comparison only | Not a native wishlist page |

Use Aspen's share URL, not the API's Online Store `url`. Do not expose the
private key or accept a customer ID to construct any of these requests.

### Save for later and recovery limits

Saving writes the destination before removing the cart source. Only supported
lines qualify: selling-plan lines and lines with unsupported custom attributes
remain in the cart. The drawer displays saved items but does not add a Save for
later control to every cart line. Session pending-save bookkeeping permits
retry of an independently failed source removal for up to 24 hours.

Restore deletes the exact list/product/variant first. Only `changed: true`
permits the Shopify cart write; another worker receiving `changed: false`
refreshes instead of adding a duplicate. The in-memory queue alone is not the
cross-worker claim. `_aspen_wishlist_transfer` identifies cart lines from an
earlier attempt, including partial restores.

Confirmed Shopify rejection/partial acceptance re-saves only the unaccepted
quantity. Re-saving resets its saved date and price reference. Uncertain cart
writes or failed compensation report an incomplete transfer and are not
automatically replayed. There is no durable exactly-once transaction across
Themivo and Shopify: interruption between deletion and the cart write cannot
be automatically recovered with the documented API. Do not describe the
marker, session, or process-local queue as a durable recovery ledger.

## Files

This is the exact implementation file map at commit
[`c594d67deb838baffe4406b2f1db4b2f7e626b3c`](https://github.com/Weaverse/aspen/commit/c594d67deb838baffe4406b2f1db4b2f7e626b3c),
relative to main commit `3f0887d3340f5a0c6f87b5b2bfe8f6b7c8867693`.
Inspect these pinned revisions when porting or removing; current main may
contain newer unrelated changes. This cookbook and its discovery link are
documentation additions after that snapshot.

### Added provider files

Delete these only after removing their consumers in the steps below.

| File | Role |
| --- | --- |
| `app/utils/themivo-wishlist.server.ts` | REST client, identity, merge, caching, permissions/errors, lists/sharing/collaborators and cart transfer |
| `app/utils/themivo-products.server.ts` | Storefront hydration, suggestions, variant validation |
| `app/utils/themivo-appearance.server.ts` | Public config fetch/cache and normalized UI settings |
| `app/utils/themivo-script-preview.ts` | Local widget detection, preview navigation, private wishlist path helper |
| `app/utils/themivo-translations.ts` | Vendor translation mapping |
| `app/hooks/use-themivo-translation.ts` | Vendor translations with Aspen translation fallback |
| `app/components/wishlist/themivo-button-appearance.ts` | Button style mapping |
| `app/components/wishlist/themivo-wishlist-entry.tsx` | Header/floating entry |
| `app/components/wishlist/themivo-wishlist-dialog.tsx` | Drawer/popup shell |
| `app/components/wishlist/themivo-wishlist-page-layout.tsx` | Full-page shell |
| `app/components/wishlist/themivo-wishlist.tsx` | Lists, sharing and collaborator interactions |
| `app/components/wishlist/themivo-wishlist-items.tsx` | Grid/list items and Shopify add-to-cart |
| `app/components/cart/cart-saved-for-later.tsx` | Optional cart saving/restoration UI |
| `app/routes/($locale).wishlist.tsx` | Wishlist loader/action/page |
| `app/routes/($locale).wishlist.shared.$token.tsx` | Read-only shared page |
| `app/routes/($locale).wishlist.join.$token.tsx` | Invitation flow |
| `app/routes/($locale).wishlist.preview.tsx` | Local widget page |
| `app/routes/($locale).api.wishlist.saved-cart.ts` | Optional saved-cart endpoint |
| `tests/themivo-wishlist.unit.test.ts` | Mocked REST, identity, claims and cart transfer regression tests |
| `tests/themivo-products.unit.test.ts` | Product hydration/order/availability regression tests |

### Added files with shared consumers

Do not delete these simply because this integration originally introduced them.

| File | Role and removal rule |
| --- | --- |
| `app/components/layout/drawer-panel.tsx` | Shared cart/wishlist drawer chrome; retain for cart drawer |
| `app/components/layout/navbar-count.tsx` | Shared cart/wishlist badge typography; retain for cart count |
| `app/components/product/product-card-appearance.ts` | Shared card appearance hook/styles; retain for regular product cards |
| `app/components/wishlist/use-product-wishlist.ts` | Shared product-button settings hook; simplify to native behavior or restore its consumers first |
| `app/components/wishlist/wishlist-icon.tsx` | Shared wishlist icon renderer; retain a native renderer or restore button icons first |
| `app/components/wishlist/wishlist-position.ts` | Shared image positioning; retain if native buttons still import it |

### Edits to existing files

| File | Integration edit / selective removal |
| --- | --- |
| `.env.example` | Placeholder secret; remove only the Themivo entry |
| `env.d.ts` | Secret and guest-session typing; remove only Themivo fields |
| `app/root.tsx` | Provider flag, Appearance, guest merge, floating entry, preview script; keep the native provider, Shopify session commit and analytics shell |
| `app/utils/root.server.ts` | Select native or Themivo root wishlist load; restore native branch |
| `app/components/wishlist/wishlist-provider.tsx` | Variant/count/rules/guest/toast support; retain native context/add/remove/auth/loading/error behavior |
| `app/types/wishlist.ts` | Extended response, Themivo items/lists and transfer attribute; retain native `WishlistApiResponse` |
| `app/routes/($locale).api.wishlist.ts` | Themivo delegation, stats and variant validation; keep native loader/action and preview support |
| `app/routes.ts` | Register added wishlist routes; retain existing native API registration and all unrelated routes |
| `app/components/wishlist/product-card-wishlist-button.tsx` | Provider-backed card icon/placement/variant behavior; restore native button without adding another heart |
| `app/components/wishlist/product-wishlist-button.tsx` | Product form/image behavior; restore native button |
| `app/components/product/product-card.tsx` | Card appearance/variant integration; preserve shared card layout/behavior |
| `app/components/product/quick-shop.tsx` | Product-style wishlist placement/selected variant; preserve quick-shop form and stock behavior |
| `app/sections/main-product/index.tsx` | Product-style button placement/selected variant; keep product UI |
| `app/sections/single-product/index.tsx` | Featured Product equivalent; keep section schema/form |
| `app/weaverse/schema.server.ts` | `pcardWishlistAppearance` visual choice; remove only this integration setting/help text, not native wishlist enable settings |
| `app/components/layout/header.tsx` | Wishlist entry and shared badge; keep cart/account/search and responsive spacing |
| `app/components/layout/cart-drawer.tsx` | Shared `DrawerPanel`; preserve cart drawer |
| `app/components/animate-drawer.tsx` | Close-focus/exit callbacks; retain if any drawer consumer needs them |
| `app/components/product/quick-shop-frame.ts` | Exported frame styles reused by popup; retain quick-shop styles |
| `app/components/product/variant-prices.tsx` | Broader price/compare-at input type for hydrated items; safe to retain |
| `app/components/cart/cart-line-item.tsx` | Page-only save control; remove that control/import, preserve line/remove/subscription UI |
| `app/components/cart/cart-main.tsx` | Saved items in drawer/empty cart; remove those mounts only |
| `app/routes/($locale).cart.tsx` | Saved-list mount below cart; preserve cart loader/action/checkout |
| `app/components/cart/cart-sync.tsx` | Saved-list change notification; remove only notification-specific dispatch/bookkeeping, keep cart synchronization |
| `app/components/cart/cart-best-sellers.tsx` | Abortable recommendation fetch; retain independent cart recommendations |
| `app/components/cart/cart-line-qty-adjust.tsx` | Shared quantity styles; retain quantity/limit behavior |
| `app/components/cart/drawer-frame.ts` | Exported item/quantity styles shared with wishlist; retain cart styling |
| `app/components/link.tsx` | Local widget-preview query propagation; remove only preview handling |
| `app/components/nav-link.tsx` | Same for navigation links |
| `app/components/root/custom-analytics.tsx` | Exclude private wishlist token paths; remove/replace helper only when those routes are removed |
| `app/utils/revalidation.ts` | Wishlist action exclusions; remove only obsolete route handling, preserve other storefront actions |
| `app/utils/translated-error.ts` | Themivo error-key handling; preserve other translated errors |
| `app/locales/en-us.json` | Wishlist UI/errors; prune only now-unused integration keys, keep native wishlist strings |
| `app/weaverse/csp.ts` | Vendor host allowances for local script comparison; remove that branch, preserve the rest of CSP |
| `server.ts` | Configured-provider private caching and token-page headers; remove obsolete predicates without weakening native/account/cart privacy or session commits |
| `codegen.ts` | Customer Account query discovery in server adapter and Storefront exclusion; remove only that file's patterns |
| `customer-account-api.generated.d.ts` | Generated adapter customer query types; regenerate after changing query discovery |
| `storefront-api.generated.d.ts` | Generated product hydration types; regenerate after removing documents |
| `tests/locale.unit.test.ts` | Revalidation after wishlist share/revoke and localized wishlist toggles; remove those cases with the corresponding route helpers, preserving unrelated locale/revalidation tests |
| `tests/main-product-quantity.browser.mjs` | Wishlist dependency mocks; update to native exports, keep quantity tests |
| `tests/quick-shop-stock.browser.mjs` | Wishlist dependency mocks; update to native exports, keep stock tests |
| `docs/integrations.md` | Setup/features/recovery contract; update when removing support |

Native files remain authoritative and must survive removal:
`app/utils/wishlist.server.ts`, `app/utils/wishlist-preview.server.ts`,
`docs/customer-wishlist-setup.md`, and `tests/wishlist.unit.test.ts`.

## Recipes

### Add the integration to another Aspen checkout

If these files already exist, configure/test them instead of installing a
second provider. For a checkout without the implementation:

1. Read this file map and compare the pinned integration with the target.
   Inspect individual files, quoting paths containing `$` or parentheses:

   ```sh
   git diff 3f0887d3340f5a0c6f87b5b2bfe8f6b7c8867693 c594d67deb838baffe4406b2f1db4b2f7e626b3c -- 'app/routes/($locale).api.wishlist.ts'
   ```

   Fetch the reference commit if unavailable. Do not transplant the whole
   branch/merge history or overwrite newer target files.
2. Add the server adapter, hydration, Appearance, types and secret declaration.
   Wire root loading/merge and native fallback before UI changes. Retain the
   native utilities and configure their customer metafield as a rollback path.
3. Extend the existing `/api/wishlist` and provider, then existing card/product
   buttons. Validate variants and server identity. Never add per-card private
   wishlist loads, browser API keys, or a second independent heart.
4. Add the wishlist page, shared/invite routes and locale-aware navigation;
   connect header/floating entries and Aspen/Themivo appearance. Apply private
   cache, token referrer/robots and analytics handling alongside the routes.
5. Add optional saved-cart UI/API and shared cart/style edits selectively.
   Preserve Shopify cart IDs, quantity/stock logic and checkout. Keep the
   delete/`changed` claim and documented recovery limits together.
6. Add public translations/config support. The local vendor-script comparison
   is optional: if omitted, do not add its script, preview route, query
   propagation or CSP allowance; retain equivalent privacy checks for the
   REST share/invite routes. Production REST works without the preview param.
7. Update query discovery, regenerate types (`npm run codegen`), add regression
   tests, then perform installation and missing-key checks below.

### Disable without removing code

1. Remove/unset `WISHLIST_API_KEY` locally and in each deployment being disabled.
   Restart/redeploy; a browser reload alone does not change server secrets.
2. Verify native cards/PDP through `/api/wishlist`. Remove merchant navigation
   links to Themivo-only `/wishlist` pages, which no longer provide a page.
3. Do not wipe the whole session: it also holds account/cart state. Resolve
   any pending transfer before selectively clearing obsolete Themivo state.
4. Existing Themivo data stays with Themivo; native data stays in the customer
   metafield. Removing a key neither exports nor merges these datasets. A
   failed provider request with the key still set is not this fallback mode.

### Remove the integration code

1. **Decide data handling first.** There is no shipped Themivo-to-native
   migration/export/import tool. Native stores at most 100 product GIDs and
   cannot represent multiple lists, variant quantities or sharing/collaborators.
   Plan and authorize any export/conversion separately before revoking access.
   Verify vendor retention/deletion terms before uninstalling the app; this
   cookbook does not guarantee retention after uninstall. Do not delete
   customer lists or mutate carts as an incidental cleanup step.
2. **Detach server selection.** In `root.server.ts`, always use native wishlist
   loading. In `root.tsx`, remove Themivo flags/config/merge, floating UI and
   preview script; keep `WishlistProvider`, its native initial data and normal
   Shopify session commits. In the existing API route, remove Themivo branches
   and imports, retaining the native loader/action, validation, compare-and-set
   writes, authentication, private responses and preview cookie behavior.
3. **Restore shared buttons/provider.** Remove variant/list/rules/toast-specific
   state and translations while preserving native product-GID operations,
   loading/errors and sign-in/setup states. Restore native card/PDP controls
   across cards, Featured Product, Main product and Quick View. Simplify or
   detach `use-product-wishlist.ts`, `wishlist-icon.tsx`, and
   `wishlist-position.ts` before deleting any of them. Remove the appearance
   choice from the schema, keeping native wishlist enable/disable settings.
4. **Detach UI/routes.** Remove header/floating entries and only the five
   added route registrations (wishlist, shared, join, preview, saved-cart).
   Keep `/api/wishlist`. Remove saved-cart mounts/control and its change event
   dispatch from cart consumers, retaining cart synchronization, cart cookie
   updates, quantity/removal logic, best sellers, and checkout. Existing
   `_aspen_wishlist_transfer` attributes on Shopify lines are metadata; do not
   clear shoppers' carts to remove them.
5. **Preserve shared refactors.** Keep `DrawerPanel`, `NavbarCount`, product
   card appearance and exported drawer/quick-shop styles wherever cart/product
   consumers still use them. Keep animation callbacks and widened price types
   if needed. Use the pinned diff to undo individual integration hunks; never
   restore whole shared files to old main or revert a merge commit wholesale.
6. **Remove preview/security dependencies in order.** Remove preview handling
   from links and CSP. Remove private wishlist predicates from server/analytics
   only after deleting token routes (or replace them if other routes still
   need them). Preserve unrelated privacy headers and authentication handling.
7. **Delete detached files and prune configuration.** Use the file map and
   reference search to remove provider-only modules/routes/tests. Remove only
   Themivo response types, error/localization keys, revalidation cases, secret
   and guest-session declarations. Keep native response types/utilities/tests.
   Remove adapter query patterns from `codegen.ts` and run `npm run codegen`;
   do not hand-delete unrelated generated types. Update browser-test mocks to
   native exports without dropping their stock/quantity scenarios. Update
   `docs/integrations.md` and `.env.example` to describe the resulting support.
8. **Verify before revoking credentials.** Search remaining references and
   classify any retained shared helper/transfer metadata deliberately:

   ```sh
   rg -n -i 'themivo|wishlist-edge|wl-count|themivo-preview|_aspen_wishlist_transfer' app server.ts env.d.ts codegen.ts tests .env.example
   ```

   Complete removal checks below, then revoke an unused vendor key/uninstall
   only when authorized and data handling is settled. Remove deployment
   secrets too; deleting the local `.env` entry does not update Oxygen.

## Verification

### Automated checks

Run on a supported Node version with dependencies installed. These commands
match the reference snapshot's scripts and test runners:

```sh
node --experimental-strip-types --test tests/themivo-wishlist.unit.test.ts tests/locale.unit.test.ts
npx --no-install vite-node tests/themivo-products.unit.test.ts
node --experimental-strip-types --test tests/wishlist.unit.test.ts
npm run typecheck
npm run build
```

Hydration tests need Vite's module resolution; the native Node runner does not
resolve their extensionless application imports. Conversely, the adapter tests
use separate native module instances to model workers; do not replace their
runner with one that deduplicates those instances. After removal, omit deleted
Themivo tests and retain native/remaining locale checks. Run the checkout's
formatter/linter on edited files and the relevant browser stock/quantity tests.

### Installation checks

- **Identity/sync:** guest save/remove/duplicate save; signed-in save and
  cross-device reload; guest-to-customer merge once; confirm another shopper
  cannot select an identity through request input. Native metafield data must
  not be overwritten by Themivo writes.
- **Buttons:** card, Quick View, Featured Product and PDP reflect the same
  default-list state. With variant saving, two variants count as two saved
  items; removing one preserves the other. Check desktop/tablet/mobile.
- **Configuration:** switch Aspen/Themivo appearance, placements, header count,
  floating launcher, Drawer/Popup/Page, Grid/List, translations and hide rules.
  Verify after cache expiry. Hidden prices include compare-at prices.
- **Lists/access:** create/rename/delete/move as a signed-in owner; share/revoke
  an Aspen link; check it in another browser; invite/accept/leave with a second
  signed-in customer. Read-only viewers must not gain edit permissions.
- **Cart:** add a saved variant to Shopify cart; save an eligible cart line,
  restore once, retry/double-click and issue concurrent restores. Losing claims
  must not add quantity. Check confirmed rejection/partial acceptance versus
  uncertain writes; report the recovery limit, not an exactly-once guarantee.
  Subscription/custom-attribute lines remain intact; stock/checkout still work.
- **Failures/privacy:** missing/invalid key, disabled features, forbidden access,
  login required, rate limit and vendor outage. No silent native writes on
  outage, no key in browser source/responses, no public caching of private
  wishlist data or analytics/referrer leakage of share/invite tokens.
- **Deployment:** real OAuth, guest merge, cross-device/collaborator flows and
  alert emails must also be checked on the intended HTTPS deployment. Trigger
  test emails only with permission; validate product/variant/buy links there.

### Missing configuration and removal checks

1. Unset the key and restart. Product pages/cards still render, native preview
   toggles work locally, and real signed-in customers use
   `custom.aspen_wishlist`. Verify the metafield is configured first.
2. Guest production behavior follows native sign-in requirements, not Themivo
   guest persistence. Themivo-only header/floating/cart controls do not remain.
   `/wishlist` is unavailable rather than pretending native data migrated.
3. After code removal, run native tests/typecheck/build and exercise card/PDP/
   Quick View toggles, cart page/drawer, recommendations, quantity limits,
   add/remove/checkout, header badge and dialog focus/scroll on all three sizes.
4. Check route registration and remaining imports; no dangling deleted module,
   vendor script/network request, preview query propagation or deployment key.
   Existing native customer data is unchanged; no vendor lists were deleted.

Automated tests use mocked providers. Passing them does not prove live
cross-worker behavior, deployed OAuth, collaborator permissions or email
delivery. Record the environment and results of manual checks in the PR;
leave unperformed checks explicitly pending.

## Example Agent Instructions

### Adding

> Read `guides/themivo-wishlist-cookbook-recipe.md`, the current Themivo headless/REST
> docs and this checkout's dependencies. Add the server REST adapter behind the
> existing provider/buttons, keeping native fallback and one wishlist button
> per surface. Use the pinned implementation as a reference, porting shared
> hunks selectively. Keep the key/server shopper identity private. Include
> locale-aware routes, privacy handling, variant/count behavior, and optional
> saved-cart claim/recovery limits. Do not enable the comparison script in
> production. Run automated and permitted UI checks; report pending deployed
> checks honestly. Do not migrate/delete customer data or commit/push yet.

### Removing

> Read the cookbook's file map and removal recipe. Restore native wishlist
> provider/API/buttons and remove only Themivo-specific UI/routes/config.
> Preserve shared cart/quick-shop/animation/card/badge code and native customer
> data. Inspect pinned diffs rather than reverting whole files or merges.
> Regenerate query types, update mocks, run native/typecheck/build and cart/UI
> regression checks. Explain retained shared helpers and the lack of automatic
> data migration. Do not delete vendor data, revoke keys, uninstall the app or
> commit/push without authorization.
