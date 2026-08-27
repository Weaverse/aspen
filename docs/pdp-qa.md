# PDP gallery and product information QA

Date: 2026-08-12

## Design reference

- Tablet SVG: 834 × 6754 px.
- Mobile SVG: 430 × 7835 px.
- Existing Weaverse `main-product`, recommendations, and review sections were
  reused. The PDP work is isolated to the gallery and product information
  experience.

## Visual and responsive checks

- Mobile was verified at 430 × 932. The product gallery is a full-width square
  carousel with side arrows and a segmented progress indicator. Product
  information uses the design's 32 px inset and does not overflow horizontally.
- Tablet was verified at 834 px. The gallery remains full-bleed and square,
  followed by the product information layout below it.
- Desktop was verified at 1280 × 900. Gallery and product information render in
  two columns without horizontal overflow; the product information remains
  sticky while browsing media.
- The title, price, color swatches, non-color option pills, quantity stepper,
  Add to bag, Shop Pay, and product-information accordions match the supplied
  visual direction.
- Empty media, one-media, sold-out/disabled option, and low-inventory rendering
  have guarded states. Low-inventory threshold and copy are configurable in the
  Weaverse schema.

## Manual commerce-flow checks

Local preview: `http://localhost:3457`

- Opened `/products/philippe-accent-chair` at 430 × 932.
- Used the next-media control and confirmed the active product image changed.
- Increased quantity from 1 to 2 and selected Add to bag.
- Cart drawer opened with `Philippe Accent Chair`, `Pearl Beige`, quantity 2,
  and a $1,398 line total; header cart count increased from 12 to 14.
- Opened `/products/hamilton-round-performance-fabric-swivel-armchair`, selected
  `Smoke Gray`, and confirmed the URL, pressed swatch state, variant ID, and
  Shop Pay URL updated to that variant.
- Opened Summary and confirmed its accessible expanded state and content; the
  configured Dimensions panel renders expanded by default.

## Automated verification

- `npm run typecheck` — passed with no TypeScript errors.
- `npm run biome` — exited 0; 263 files checked. The repository reports 167
  existing warnings and no blocking lint or format errors.
- `npm run build` — exited 0. Client built in 2.20 s and the Oxygen server bundle
  built in 1 min 12 s.
