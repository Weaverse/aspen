# Predictive Search empty-state QA

Date: 2026-08-13

## Design reference

- Figma project: `Theme — Home + Furniture`.
- Approved empty-state copy: `No results for “keyword”`.
- Approved structure: `SUGGESTIONS` followed by the submitted keyword, then
  `PRODUCTS` followed by the no-results message.
- Desktop uses two columns; the mobile search drawer stacks the same content.

## Implemented coverage

- Replaced the previous generic centered no-results message on desktop and
  mobile with the approved Figma structure and copy.
- The empty product state is now detected even when Shopify returns a predictive
  query suggestion but no product results.
- Desktop results height collapses to its content in the empty state instead of
  retaining the 460 px populated-results viewport.
- The submitted term is read synchronously from the keyed search request so the
  message cannot briefly show the previous search term.
- Added a polite status announcement for assistive technology.

## Preview QA

- Production preview query: `zzzzaspenempty`.
- Desktop at the available 1280 × 720 preview viewport: verified two-column
  layout, submitted keyword, exact no-results copy, 14 px DM Sans typography,
  1 px section dividers, left alignment, and compact dropdown height.
- Mobile implementation uses the approved 430 px drawer, 20 px horizontal
  padding, stacked headings and content, and the same 14 px typography.
- No horizontal overflow is introduced by the empty state.

## Automated verification

- `npm run typecheck`: passed with exit code 0.
- Targeted `biome check`: passed; three changed implementation files checked.
- `npm run biome`: passed with exit code 0; it reports 147 pre-existing
  repository warnings and no errors.
- `npm run format:check`: passed; 267 files checked.
- `npm run build`: passed; client and Oxygen server bundles completed.
- `git diff --check`: passed with exit code 0.

## Design boundary

The inspected Figma file contains an approved empty state for Predictive Search
only. Collection, PDP, cart, and full search-results empty states were not
invented in this pass.
