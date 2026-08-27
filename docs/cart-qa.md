# Cart QA notes

Date: 2026-08-12

## Automated verification

- `npm run codegen`: passed. Storefront API cart types were regenerated with discount allocations and gift-card mutations.
- `npm run typecheck`: passed with exit code 0.
- `npm run biome`: passed with exit code 0. Biome checked 265 files and reported 148 existing repository warnings, with no errors.
- `npm run build`: passed with exit code 0. Client and Oxygen server bundles completed; the server build finished in 1m 7s.
- `git diff --check`: passed with exit code 0.

## Manual commerce-flow verification

Tested against the local Shopify-backed preview at mobile, tablet, and desktop widths.

- Cart page rendered at 430 px and 834 px without horizontal overflow.
- Desktop cart drawer rendered as a 430 px right-side panel with an independently scrollable item region and fixed checkout actions.
- Product lines displayed their image, selected options, selling plan, discount allocations, unit price, line total, quantity control, and remove action.
- Quantity update was verified from 2 to 3 and back to 2; subtotal changed from $10,882 to $11,881 and returned to $10,882.
- Remove was verified with the Amber Swivel Chair, then the product was added back from its PDP and appeared in the cart drawer with the selected Dark Moss option.
- Cart note was saved successfully, then cleared.
- Invalid discount code, invalid gift-card code, and invalid combined cart-code states showed inline errors without taking the cart page down.
- `View cart` navigated to the locale-aware cart route and closed the drawer.
- The “You May Also Like” rail loaded six live Shopify products and its responsive carousel controls.
- Loading, empty-cart, unavailable-line, and mutation-error render paths are present in the shared cart components.

## Final desktop cart-page verification

The final 1728 × 3002 px cart-page SVG supplied on 2026-08-12 was rendered
locally and compared side by side with the storefront at a 1728 px viewport.

- The cart content begins at x = 184 px and uses the approved 1360 px width.
- The first cart line begins at y = 248 px (2 px from the SVG's y = 250 px)
  and renders at 900 × 360 px, with a 360 px media column.
- The order-summary content begins at x = 1128 px and is 392 px wide inside
  its 440 px column, matching the SVG's 24 px inset.
- The page reported `scrollWidth === clientWidth === 1728`, so the fixed
  desktop grid introduces no horizontal overflow.
- The recommendation rail renders three equal-width cards in the 1360 px
  container with 16 px gutters, plus the approved View All and arrow controls.
- After the final desktop adjustment, `npm run typecheck` and `npm run biome`
  passed again. The production build passed with exit code 0 and finished its
  Oxygen server bundle in 1m 5s.

## Known QA limitation

No valid discount code or gift card was available in the connected test store. Successful application could therefore not be verified manually; the failure paths were verified, and the mutation paths passed code generation, typecheck, and production build.
