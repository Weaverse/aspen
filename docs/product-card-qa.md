# Product Card QA — 2026-08-11

## Automated checks

- `npm run codegen`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed (client and Oxygen server bundles).
- `npm run routes-check`: passed; all standard Shopify routes are present.
- `npm run biome`: exited successfully. The repository still reports 190
  existing warnings. Targeted checks for Product Card, wishlist, Quick Shop,
  cart, and revalidation code report no errors; three existing unused
  suppression warnings remain in `app/utils/root.server.ts`.

## Manual production-preview checks

Previewed locally with the MiniOxygen production runtime at
`http://localhost:3458`.

- Desktop collection `/collections/chairs` renders Product Cards, swatches,
  sale pricing, wishlist controls, and Quick Shop without an error state.
- Anonymous wishlist selection redirects through the Customer Account login
  flow and preserves the collection path as `return_to`.
- Product Card → Quick Shop → Add to Cart succeeds, increases the cart count,
  closes Quick Shop, opens Cart Drawer, and keeps the collection URL.
- PDP `/products/amber-swivel-chair?Color=Dark+Moss` → Add to Cart succeeds,
  increases the cart count, and opens Cart Drawer with the selected variant.
- Mobile collection was checked at 390 × 844: Product Cards, swatches, Filter,
  Sort, and Quick Shop remain available without an error state.
- No 500 page or hanging-promise error occurred during the verified cart
  flows.

## Production setup still required

Create and expose the customer metafield described in
`docs/customer-wishlist-setup.md`, then verify add/remove persistence with a
signed-in test customer and a second browser session. This cannot be completed
with an anonymous local Customer Account session.

New Arrival and rating behavior were intentionally not changed in this pass.
