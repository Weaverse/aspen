# @weaverse/aspen

## Unreleased

### Hydrogen 2026.10 and Weaverse v6

- Updated the storefront foundation to Hydrogen 2026.10 and Weaverse v6 while
  retaining Aspen's page sections, theme settings, navigation and commerce UI.
- Migrated product selection, cart handlers, customer account queries, analytics
  and section data loading to the new APIs. Preserved Aspen's queued cart
  updates, inventory checks, discounts, gift cards and order notes.
- Reconciled cart buyer identity after Customer Account authorization, refresh
  and logout; signed-out mutations explicitly clear old customer tokens, and
  failed logout detachment expires the cart cookie. Account login redirects keep
  order keys and other page parameters while stripping React Router metadata.
  Temporary account refresh failures retain customer identity and allow cart
  mutations to be retried.
- Moved collection browsing to Hydrogen's collection store. Existing filter and
  sort links redirect to the new URL format; pagination supports forward and
  backward navigation. Default collection ordering, combined category/facet
  selections and missing-collection cursor recovery are preserved.
- Preserved locale-aware price formatting, translated merchant content, SEO,
  image rendering and Studio component settings.
- Local development uses Vite/MiniOxygen, with HTTPS available through
  `npm run dev:https`. Builds use React Router; `npm run typecheck` now checks
  GraphQL documents as well as TypeScript. Node requirements remain
  `^22.18.0 || ^24.11.0`.
- See [migration and verification notes](docs/hydrogen-2026-10-migration.md)
  before deploying. Oxygen deploy and a published release remain outstanding.

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
