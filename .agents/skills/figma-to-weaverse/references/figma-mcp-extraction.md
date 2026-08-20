# Figma MCP extraction cheat-sheet

How to pull the design DNA out of a Figma file with the Figma MCP, and how it
maps onto the Weaverse JSON generator. Companion to this skill's `SKILL.md`.

## Tool-by-tool

| Tool | What it gives you | Used for |
|------|-------------------|----------|
| `get_metadata` | node/frame tree of the file or a frame | section boundaries; one top-level frame ≈ one section block |
| `get_variable_defs` | design variables (color, type, spacing, radius) | theme token mapping (see below) |
| `get_design_context` | layout, auto-layout, text content, component usage of a frame | composition + content per section |
| `get_context_for_code_connect` | one component's properties, **exhaustive variant options**, descendant tree | hover/active/disabled states; section prop boundaries |
| `list_file_components_for_code_connect` | flat whole-file component graph (published components only) | planning reuse before decomposing |
| `get_motion_context` | animated-node inventory, keyframe tracks + easing, **pre-computed CSS `@keyframes` / motion.dev snippets** | real animation values; `recursive: true` for a subtree |
| `download_assets` | exported image/icon files + URLs | content manifest asset columns |
| `get_screenshot` | rendered image of a frame/node | approval checkpoint + preview verification |
| `search_design_system` / `get_libraries` | library components in use | understanding reusable component intent |

Read order for a page: `get_metadata` (structure) → `get_variable_defs` (tokens)
→ `get_design_context` per frame (content/layout) → `get_context_for_code_connect`
on interactive components (states) → `get_motion_context` where motion is suspected
→ `download_assets` (assets) → `get_screenshot` (visual check).

Screenshots are a verification aid, never the extraction method. Reading layout off
a rendered image throws away every structured signal in the table above and is what
produces flat, static-looking output.

## Token mapping → `project.config.theme`

`get_variable_defs` returns the design system's variables. Map them onto the
theme keys the JSON generator accepts (see
`generating-weaverse-project-json` → `project.config.theme`). Common mappings:

| Figma variable kind | Weaverse theme key(s) |
|---------------------|------------------------|
| Primary / brand color | `colorPrimary`, `buttonPrimaryBg` |
| Text / foreground color | `colorText`, `colorForeground`, `buttonPrimaryColor` |
| Background / surface color | `colorBackground`, `headerBgColor`, `footerBgColor` |
| Border / divider color | `colorLine`, `colorLineSubtle` |
| Muted / subtle text | `colorTextSubtle` |
| Body font size | `bodyBaseSize`, `bodyBaseLineHeight`, `bodyBaseSpacing` |
| Heading scale (H1) | `h1BaseSize`, `headingBaseLineHeight`, `headingBaseSpacing` |
| Corner radius | `btnCornerRadius`, `pcardBorderRadius` |
| Container / max width | `pageWidth`, `headerWidth`, `footerWidth` |

Only set theme keys you can back with an actual Figma variable or a clear value
from the design. Don't copy a full demo theme blindly.

## Reading composition from auto-layout

Figma auto-layout encodes composition directly — read it instead of guessing:

- **Horizontal** auto-layout with media + text children → `side-by-side`
- **Vertical** auto-layout, text above/below media → `stacked`
- Repeated child instances in a wrap/grid → `card-grid`
- Absolute-positioned text over a full-bleed image fill → `background-overlay`
- A single visible card in a frame named like a carousel / with prototype
  links between frames → `card-slider` (confirm from the prototype, not from
  the static frame alone)

## Interaction — query first, infer last

A static *frame* has no runtime behavior, but the *file* usually does. Work down
this ladder and only fall through to guessing at the last rung.

### 1. States are component variants

Designers rarely draw a hover effect — they add a variant property such as
`State = Default | Hover | Pressed | Disabled`. The state already exists as a real
node; it just isn't on the frame you're looking at.

Call `get_context_for_code_connect` on every interactive component (buttons, cards,
nav items, inputs) to get its exhaustive variant options. Map them onto the section's
CSS states, and let the variant set — not the screenshot — decide which states exist.
A component with no `Hover` variant means the designer didn't specify one; use the
brand guideline's default hover treatment rather than inventing a bespoke one.

### 2. Animation is real data

Where motion exists, `get_motion_context` is the source of truth for timing, easing,
and keyframe values. Use `recursive: true` to cover a subtree in one call.

- Join motion to structure by node id: `get_motion_context` says *which* nodes animate
  and with what values; `get_design_context` says what they look like. Match on
  `data-node-id`.
- **Use the returned `codeSnippets` verbatim** — don't regenerate timing from raw
  tracks, that loses custom bezier and spring fidelity.
- Recursive responses include `timelineCohorts` (`rootNodeId`, `durationMs`,
  `loopMode`, `memberNodeIds`). Drive a cohort from one shared lifecycle instead of
  inferring order from sibling position.
- On any conflict with design context, motion context wins.

### 3. Known gap — variant transitions

Transitions between variants (`On click → Change to variant B` with Smart Animate)
travel a **separate data path that `get_motion_context` does not yet return**. You
get the start and end variants but not the curve between them.

Fallback: implement the variant as a CSS state class or conditional render, plus a
short `transition:` on the changing properties. For storefront hover states this is
indistinguishable from Smart Animate in practice — don't escalate it as a blocker.

### 4. Escape hatch — prototype reactions via Plugin API

When the trigger itself matters (hover vs click vs drag, auto-advance delay), read
the node's `reactions` array through `use_figma`, which executes JavaScript against
the Figma Plugin API. Load the `figma-use` skill first. Treat this as a targeted
probe for a specific question, not a bulk extraction step.

### 5. Only now, infer

If the ladder above yields nothing, fall back to weak signals — prototype links
between frames, frame/layer names (`Slider`, `Marquee`, `Carousel`), designer notes
or FigJam alongside the design — and otherwise classify the block as `static`.

Do not map a multi-card frame to a Swiper-based section just because several cards
are shown — that mismatch is the Figma equivalent of the website skill's "basically
a grid" mistake.

## Assets

- Prefer `download_assets` for real exported files; record the returned URL in
  the content manifest.
- For images placed via image fills, export the node with `get_screenshot` only
  as a fallback — a screenshot is not a production asset.
- Figma has no runtime video. If a frame represents a video block (poster image,
  play button, frame named `Video`), record the intent in the manifest's Notes
  column and source the actual video URL from the brand/asset library, not from
  Figma.
- When an export fails, mark the manifest cell `MISSING — [describe]`. Never
  substitute a placeholder.
