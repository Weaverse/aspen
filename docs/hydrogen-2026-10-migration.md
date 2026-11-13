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

## Validation

- Typecheck, GraphQL validation and production build pass on supported Node 22.
- 186 TypeScript unit tests and 52 merchant-blog/CMS/route tests pass.
- The three product quantity/stock browser suites pass all 22 tests, covering
  pending submissions, rejected adds, inventory limits and variant changes.
- Oxygen Preview build, upload and routability verification pass after merging
  the latest main and including the local cart-link fixes.
- Live French Customer Account OAuth passes OTP login, callback, session
  persistence after reload and logout returning to the correct market.
- Live cart add, inventory-limit locking, persistence after reload and removal
  pass on the same Preview deployment. No checkout order was placed.
- Studio draft selection, editing, save, revalidation and reload persistence
  were verified locally against the migrated checkout.

For new Shopify storefront credentials, enable inventory read access for
`quantityAvailable` queries. Register the HTTPS OAuth callback and required
localized logout URLs for the deployment being tested.

Spanish OAuth has not been tested with a fresh OTP session. A version/tag and
GitHub Release still need to be published after merge to complete the issue.

## References

- [Pilot upgrade guide](https://github.com/Weaverse/pilot/blob/main/.guides/hydrogen-upgrades/upgrade-2026.4.7-to-2026.10.2.md)
- [Pilot cut-over spec](https://github.com/Weaverse/pilot/blob/main/.weaverse/specs/2026-10-29-hydrogen-2026-10-cut-over.md)
- [Weaverse v6 migration guide](https://weaverse.io/docs/migration-advanced/v6-migration)
- [Pilot #214](https://github.com/Weaverse/pilot/pull/214),
  [#215](https://github.com/Weaverse/pilot/pull/215),
  [#216](https://github.com/Weaverse/pilot/pull/216)
