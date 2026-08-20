# Product Details QA — 2026-08-12

## Reference coverage

- Checked against the supplied 834 × 6754 SVG and 430 × 7835 SVG.
- Verified responsive ordering at 430 px and 834 px.
- Verified there is no horizontal page overflow at either breakpoint.
- At 430 px the recommendations render before reviews; at 834 px reviews
  render before recommendations and the editorial promo is visible.
- The product-page newsletter and duplicate legacy product hero are hidden.

## Product and variant flow

- Verified the full option UI on the Anya product, including Set, Color2,
  color swatches, disabled unavailable values, one-time purchase and delivery
  subscription choices.
- Selecting the combined-listing value `4 Chairs` navigated to the matching
  product while retaining the selected options in the URL.
- On the Hamilton product, selected `Smoke Gray`, changed quantity to `2`, and
  clicked **Add to bag**.
- The cart drawer opened with the correct product, `Smoke Gray` variant,
  quantity `2`, and line total `$1,998`.

## Edge states

- Unavailable option values are disabled.
- Quantity is clamped to the selected variant's available inventory.
- Judge.me with zero reviews displays a true `0.0 out of 5`, empty rating
  bars, an empty review list, and an accessible review form.
- Story and promo images fall back to product media until exact SVG assets are
  selected through their Weaverse image settings.

## Automated verification

```text
npm run typecheck
> tsc --noEmit
exit code: 0

npm run biome
> biome check
Checked 264 files. No fixes applied.
Found 153 warnings.
exit code: 0

npm run build
> shopify hydrogen build --codegen
client: 5695 modules transformed, built in 2.07s
server: 5664 modules transformed, built in 1m 10s
exit code: 0

git diff --check
exit code: 0
```

The Biome warnings are non-blocking repository-wide diagnostics; there are no
lint errors.
