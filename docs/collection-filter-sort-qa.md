# Collection filter and sort QA

Date: 2026-08-11

## Design reference

- Figma project: `C1PelRr1RljK87RILazDOj`, starting node `582:2`.
- Mobile filter drawer SVG supplied with the task: 430 × 932 px.
- The second supplied SVG is the filter drawer reference. The first supplied SVG is a cart drawer and was intentionally left outside this change.

## Visual alignment

- Drawer width: 430 px.
- Horizontal content inset: 52 px on each side; usable content width: 326 px.
- Header and first accordion row now place the first divider at 125 px and the second at 195 px, matching the 126 px and 195 px design guides within 1 px.
- Filter groups use uppercase labels, plus/minus states, subtle dividers, rounded checkbox controls, rounded option chips, and the two-column price inputs from the SVG.
- Default open groups are configurable and default to `Price, Size, Color`.

## Manual preview QA

Preview route: `http://localhost:3458/collections/frontpage`

### Desktop

- Opened the collection and filter drawer successfully.
- Expanded `Availability`; checkbox state and disabled zero-result option rendered correctly.
- Applied `In stock`; URL became `?filter.available=true`, the drawer stayed open, and the active filter count updated.
- Entered a maximum price of 1000; URL gained `filter.price={"max":1000}` and the product result count changed from 6 to 4.
- Applied `Price, low to high`; URL gained `sort=price-low-high`, the trigger label updated, and product order started at $379, then $899, then $999.

### Mobile — 430 × 932

- Verified the real collection page inside a 430 × 932 viewport.
- Grid controls, `FILTER`, and `SORT` fit on one row without horizontal overflow.
- Opened the sort drawer and confirmed all six options, current-selection indicator, close action, and full-height drawer behavior.
- Applied `Price, low to high`; the drawer closed and results reordered with the $379 product first.
- Opened the filter drawer; measured the dialog and panel at exactly 430 × 932.
- Expanded `Availability` and applied `In stock`; checked state and `Filter (1)` active count updated while the selected sort remained applied.

### Edge state

- Loaded `?filter.price=not-json`; the collection continued to render and ignored the invalid filter value instead of returning an error page.

## Automated verification

- `npm run format:check` — passed, 263 files checked.
- `npm run typecheck` — passed with no TypeScript errors.
- `npm run biome` — exited 0; repository has 187 pre-existing warnings and no blocking lint errors.
- `npm run build` — passed; client and Oxygen server bundles built successfully.
