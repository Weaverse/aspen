# Aspen cart design specification

Date: 2026-08-12

## References

- Cart page tablet/desktop reference: supplied SVG at 834 × 3384 px.
- Cart page mobile reference: supplied SVG at 430 × 4431 px.
- Desktop cart drawer reference: supplied SVG at 430 × 1194 px.
- Final desktop cart-page reference: supplied SVG at 1728 × 3002 px.
- The repository has no `.guides/brand-guideline.md`, so the existing Aspen
  typography, color tokens, button treatment, and theme settings remain the
  visual source of truth.

## Surface mapping

| Surface | Classification | Implementation |
| --- | --- | --- |
| Cart drawer | `ADAPT_EXISTING` | Extended the global `CartDrawer` and shared `Cart` components; retained the accessible Radix dialog and Hydrogen optimistic mutations. |
| Cart page | `ADAPT_EXISTING` | Extended the existing `/cart` route and shared line/summary components for the responsive card composition in the supplied SVGs. |
| Recommendations | `ADAPT_EXISTING` | Reused `CartBestSellers` and the shared Product Card in a responsive snap rail with navigation controls. |
| Cart configuration | `REUSE_EXISTING` | Reused the global Weaverse Cart theme group for free shipping, best sellers, note, discount, gift card, and button labels. |

## Content and behavior manifest

| Block # | Block name | Data source | Interaction and notes |
| --- | --- | --- | --- |
| 1 | Cart heading | Static UI | Responsive page heading using Aspen typography. |
| 2 | Cart line cards | Shopify cart lines | Product link/image, selected options, selling plan, line discounts, unit price, line total, quantity update, optimistic removal. |
| 3 | Free-shipping progress | Cart subtotal + theme threshold | Drawer progress and success/remaining amount state. Currency follows the cart market. |
| 4 | Applied codes | Cart discount codes and gift cards | Removable discount/gift-card chips. Gift-card values only expose Shopify's masked last characters. |
| 5 | Order summary | Shopify cart cost | Combined gift-card/discount input, subtotal before line discounts, discount amount, total, checkout disclosure. |
| 6 | Advanced actions | Cart mutation route | Add/edit/clear order note, apply discount, add/remove gift card, valid/error/loading feedback. |
| 7 | Checkout actions | Cart checkout URL | View Cart closes the drawer; Checkout uses the current Shopify checkout URL. |
| 8 | Recommendations | Shopify best-selling products | Product Card rail, View All link, arrows, loading skeleton and no-results state. |
| 9 | Empty cart | Theme copy + best sellers | Existing configurable message/start-shopping action and drawer best sellers retained. |

## Responsive behavior

- Below 768 px, cart-page lines render as a square product image followed by
  the product information panel, matching the 430 px composition.
- From 768 px, each cart-page line becomes a 360 px image/information row,
  matching the supplied 834 px composition.
- The order summary stacks below cart lines through tablet sizes and becomes a
  side column at the large breakpoint.
- At the approved 1728 px desktop frame, the cart uses a 1360 px container with
  a 900 px line-card column, a 20 px gutter, and a 440 px order-summary column.
  The order-summary controls are inset by 24 px on both sides.
- Desktop line cards keep a fixed 360 px square media column. Selling-plan and
  line-discount chips sit immediately above the three-column price/quantity row.
- Recommendations use one partially visible card on mobile and three cards at
  tablet/desktop widths. The approved desktop rail uses 16 px card gutters.
- The drawer is full width on small screens and capped at 430 px on desktop.
  Its line list scrolls independently while summary/actions stay visible.

## Mutation boundaries

- `CartForm`/React Router fetchers retain optimistic line update/remove
  behavior.
- `/cart` handles line add/update/remove, discount update, gift-card add/remove,
  note update, and buyer identity update.
- The combined code form tries a discount first and, if it is not applicable,
  safely restores existing discounts before trying the value as a gift card.
- Every mutation applies the latest cart ID response headers.
