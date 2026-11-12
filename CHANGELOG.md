# @weaverse/aspen

## 2026.11.12

This release brings together the Aspen updates since `v2026.6.12`, with a
refreshed storefront, more flexible page sections, and improvements to product
discovery and cart reliability.

### Storefront design and page building

- Refreshed the header, navigation, footer, product cards, and customer account
  layouts, with improved spacing and behavior on mobile and tablet screens.
- Added a legacy design preset for stores that prefer Aspen's earlier visual
  style alongside the refreshed design.
- Expanded Weaverse Studio controls for section backgrounds, image fit and
  alignment, borders, corner radii, and responsive layouts. Fixed cases where
  saved settings, cleared colors, or older section defaults were not respected.
- Improved slideshows, promotion grids, featured collections, image-with-text,
  hotspots, testimonials, countdowns, scrolling text, and before-and-after
  sections, including smoother transitions and more consistent navigation.
- Added consistent placeholder content for sections and storefront image
  selection for Instagram cards to make page setup easier.

### Product discovery and shopping

- Updated predictive search and the search results page with clearer result
  tabs, empty states, filters, and pagination. Search filter counts now reflect
  visible listings, and hidden listings are excluded from filter facets.
- Improved collection sorting, filter drawers, layout controls, and mobile
  toolbars so shoppers can browse more comfortably across screen sizes.
- Fixed product image stretching, gallery navigation, variant controls, and
  quick-view transitions. Standardized color swatches, badges, and sale prices,
  including price ranges for combined product listings.
- Improved sold-out product handling and purchase availability, including
  adding products from quick shop when the cart is empty.

### Cart and checkout

- Refreshed the cart page and drawer with clearer order summaries, inline order
  notes, discount and gift-card feedback, and more consistent quantity controls.
- Improved cart synchronization and rapid quantity updates to reduce stale
  counts and conflicting changes. Shared inventory limits are respected across
  cart lines, with clearer add-to-cart loading and availability feedback.
- Improved drawer transitions, keyboard focus behavior, and the handoff from
  search and quick shop to the cart.

### Customer engagement

- Added customer wishlists on product cards and product pages, saved to the
  signed-in customer's account after the required Shopify metafield setup.
- Added Klaviyo back-in-stock signup for unavailable variants and contact form
  submissions recorded as Klaviyo events when the integration is configured.
- Added LoyaltyLion points hints on product pages and in the cart for signed-in
  customers when the integration is configured.
- Improved account, address, and order views, plus review and subscription
  purchase controls.

### Languages and store content

- Expanded translatable storefront text and locale-aware links, prices, and
  customer-facing messages.
- Fixed translation precedence so merchant-authored section content and saved
  theme text are preserved. Improved country and language selection behavior.
- Improved merchant navigation links, blog and article links, sharing controls,
  and footer rich-text handling.

### Setup and upgrade notes

- Updated the Shopify Hydrogen and Weaverse foundation and supporting tools.
  Local development now requires Node.js `^22.18.0 || ^24.11.0`; use `npm ci`
  with the committed lockfile.
- Added setup, section, integration, and customer wishlist guides in `docs/`.
  Wishlist, Klaviyo, and LoyaltyLion features require their documented setup;
  installing a Shopify app alone does not enable every headless integration.
- Existing development/preview limitations remain documented in
  [Node validation](docs/node-support-validation.md) and the
  [upstream security comparison](docs/node-upstream-security.md), including
  MiniOxygen behavior, Studio reconnect checks, and CLI lockfile retention.

## 5.1.8

### Patch Changes

- Updated dependencies
  - @weaverse/hydrogen@5.3.1

## 5.1.7

### Patch Changes

- Updated dependencies
  - @weaverse/hydrogen@5.3.0

## 5.1.6

### Patch Changes

- Updated dependencies
  - @weaverse/hydrogen@5.2.5

## 5.1.5

### Patch Changes

- Updated dependencies [43f3da3]
  - @weaverse/hydrogen@5.2.4

## 5.1.4

### Patch Changes

- @weaverse/hydrogen@5.2.3

## 5.1.3

### Patch Changes

- Updated dependencies
  - @weaverse/hydrogen@5.2.2

## 5.1.2

### Patch Changes

- Updated dependencies
  - @weaverse/hydrogen@5.2.1

## 5.1.1

### Patch Changes

- Updated dependencies
  - @weaverse/hydrogen@5.2.0
  - @weaverse/schema@0.4.0

## 5.0.0

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies [7164bdb]
  - @weaverse/hydrogen@5.0.0

## 5.0.0-next.1

### Patch Changes

- Updated dependencies
  - @weaverse/hydrogen@5.0.0-next.1

## 3.5.6-next.0

### Patch Changes

- Updated dependencies
  - @weaverse/hydrogen@5.0.0-next.0

## 3.5.3

### Patch Changes

- Updated dependencies
  - @weaverse/hydrogen@4.2.1

## 3.5.3

### Patch Changes

- Updated dependencies
  - @weaverse/hydrogen@4.2.0
