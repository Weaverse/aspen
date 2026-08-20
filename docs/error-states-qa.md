# Commerce error states QA

Date: 2026-08-13

## Design reference

- Desktop SVG: 1728 × 1338 px.
- Tablet SVG: 834 × 1370 px.
- Mobile SVG: 430 × 1559 px.
- All three references use the same 509 px error-content region between the
  global header and footer, with a centered status, title, and Homepage CTA.

## Implemented coverage

- Added one shared storefront error presentation for collection, PDP, cart,
  search, and other route failures.
- Missing collections and products render the approved `404 / Page not found`
  state while preserving the global announcement bar, header, and footer.
- Search API failures render a recoverable `500 / Search unavailable` state.
- Other route failures render `500 / Something went wrong`; internal error
  messages and stack traces are no longer exposed in storefront HTML.
- Collection Storefront API failures now reach the error boundary instead of
  being incorrectly converted to a missing-collection 404.

## Responsive preview QA

Verified against the local Shopify-backed production preview.

- 1728 × 1338: header bottom 136 px, error region 136–645 px, footer starts at
  645 px, no horizontal overflow.
- 834 × 1370: header bottom 136 px, error region 136–645 px, footer starts at
  645 px, no horizontal overflow.
- 430 × 1559: header bottom 86 px, error region 86–595 px, footer starts at
  595 px, no horizontal overflow.
- Homepage CTA is visible, measures 128 × 54 px, and has `href="/"`.
- Missing collection and missing product requests both returned HTTP 404 and
  retained the global header and footer.

## Automated verification

- `npm run format:check`: passed; 267 files checked.
- `npm run typecheck`: passed with exit code 0.
- Targeted `biome check`: passed with exit code 0; three existing warnings
  remain in the search route and no errors were reported.
- `npm run build`: passed; client and Oxygen server bundles completed.
- `git diff --check`: passed with exit code 0.

## Remaining state work

The approved Predictive Search empty state has now been implemented separately.
Collection, PDP, cart, and full search-results empty states still need approved
Figma references before implementation. Loading states remain a separate pass.
