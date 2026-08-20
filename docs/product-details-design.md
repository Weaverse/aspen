# Aspen Product Details design specification

Date: 2026-08-12

## References and token decisions

- Tablet/desktop reference: supplied SVG at 834 × 6754 px.
- Mobile reference: supplied SVG at 430 × 7835 px.
- The repository does not contain `.guides/brand-guideline.md`; the existing
  Aspen theme tokens, Tenor Sans/DM Sans typography, spacing variables and
  button treatments are therefore preserved.
- The SVG images are embedded bitmap data rather than reusable CDN URLs.
  Product media is used as a safe runtime fallback, while each editorial image
  remains replaceable in the Weaverse schema.

## Section mapping

| Block | Classification | Implementation |
| --- | --- | --- |
| Product gallery and information | `ADAPT_EXISTING` | Extended `main-product`; square responsive slider, badges, full options, selling plan, ATC, Shop Pay and accordions. |
| Product storytelling | `ADAPT_EXISTING` | Added a schema-backed story inside `main-product`: responsive lifestyle image plus two alternating feature rows. |
| Customer reviews | `ADAPT_EXISTING` | Reused Judge.me route data and review submission; rebuilt summary, distribution, list, pagination and empty state. |
| You may also like | `ADAPT_EXISTING` | Product-page `featured-products` becomes a three-card carousel with the existing Product Card. |
| Desktop editorial promo | `ADAPT_EXISTING` | Optional desktop-only promo at the end of `featured-products`; image/copy/link are configurable. |
| Newsletter | `REUSE_EXISTING` | Preserved globally and hidden on product pages to match the approved Product Details layout. |

## Content manifest

| Block # | Block name | Media type | Image/video source | Text / link | Shopify refs and notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Product gallery | `product-media` | Product media API | Product title, price and badges | Selected product and variant. |
| 2 | Variant and purchase form | `product-media` | Color swatch image/color API | Option values, subscription frequency, Add to bag | Product options, adjacent variants and selling-plan groups. |
| 3 | Product accordions | none | None | Summary and Dimensions | Product summary/description plus shop policies. |
| 4 | Lifestyle story | `static-image` | SVG bitmap is embedded; Weaverse override with product-media fallback | No overlay text | `storyHeroImage` and `storyHeroImageMobile`. |
| 5 | First editorial feature | `static-image` | SVG bitmap is embedded; Weaverse override with product-media fallback | “Whether a lavish velvet sofa…” | `storyFirstImage`, `storyFirstHeading`. |
| 6 | Second editorial feature | `static-image` | SVG bitmap is embedded; Weaverse override with product-media fallback | “Tactile fabric trends…” | `storySecondImage`, `storySecondHeading`. |
| 7 | Recommendations | `product-media` | Shopify collection products | You may also like / View all | Existing `chairs` collection configuration. |
| 8 | Customer reviews | none | Judge.me API | Summary, rating distribution, review form/list | Empty state is shown when the integration has no reviews. |
| 9 | Desktop promo | `static-image` | SVG bitmap is embedded; Weaverse override with product-media fallback | Decorate for holidays and beyond / Explore now | Hidden below 768 px. |

## Responsive behavior

- Below 1024 px, product media and information stack; the gallery remains
  full-width and square.
- At 430 px, Product Story is inset 20 px. Feature rows become image then text.
- At 834 px, Product Story is inset 32 px. Feature rows alternate text/image
  and image/text.
- Reviews appear before recommendations from 768 px upward and after
  recommendations on mobile, matching the two supplied compositions.
- The desktop promo is hidden on mobile.

