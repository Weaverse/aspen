# @weaverse/aspen

## Unreleased

### Technical baseline refresh

- Aligned Hydrogen, React Router, React, TypeScript, Tailwind CSS, Vite, Shopify
  CLI/Oxygen tooling, Biome, and Weaverse SDK versions with Pilot's July 2026
  baseline.
- Migrated route declarations from `@react-router/fs-routes` to React Router's
  programmatic route config while preserving existing public URLs.
- Replaced `@shopify/remix-oxygen` application imports with current
  `react-router` and `@shopify/hydrogen/oxygen` entry points.
- Migrated Weaverse component schema keys from deprecated `inspector` to
  `settings`, removed duplicate component registrations, and updated the
  Hydrogen router context integration.
- Node.js 22.12 or newer is now required.

### Follow-up

- The approved React Router 7.16 baseline and an upstream GraphQL Codegen
  dependency currently retain high-severity npm advisories. Moving React Router
  to 7.18.2 or newer requires a separately approved baseline update; the Lodash
  advisory requires an upstream-compatible Codegen release.
- Hydrogen/Vite currently emit upstream deprecation warnings for `envFile` and
  `transformWithEsbuild`; neither API is configured directly by Aspen.
- The homepage dev smoke test still reports legacy missing-schema/unknown DOM
  property warnings from existing section data and prop forwarding. These do
  not block rendering (HTTP 200) but should be cleaned up section by section in
  a separate, behavior-focused change.

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
