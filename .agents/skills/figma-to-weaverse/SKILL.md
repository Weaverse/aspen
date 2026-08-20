---
name: figma-to-weaverse
description: Use when recreating a Figma design as Hydrogen + Weaverse pages in this repo — turning a Figma file, frame, or flow into reusable Weaverse sections. Triggers on a figma.com URL, "build this design", "implement this Figma", or "create the storefront from the design". The Figma counterpart of cloning-websites-to-weaverse.
---

# Figma to Weaverse

Turn a Figma design into maintainable Weaverse pages. This is the **Figma input adapter** — the sibling of `cloning-websites-to-weaverse`, but the source is a Figma file instead of a live URL. Both adapters converge on the same downstream skill, `generating-weaverse-project-json`.

```
Figma file / frame ─→ figma-to-weaverse ─→ generating-weaverse-project-json ─→ import / content API
   (Figma MCP)        (tokens + manifest + preview)        (project JSON)
```

The two adapters share the same downstream rules. Section matching, deep schema verification, the content manifest, the clone preview route, and the brand-guideline conflict rule are **identical** to `cloning-websites-to-weaverse` — read that skill for the full matching logic. This skill only replaces the **extraction layer** (Figma MCP instead of Firecrawl) and adds Figma-specific gotchas.

## When to Use

- A figma.com URL (file, frame, or selection) is the source of a page or storefront
- "Implement this design in Weaverse", "build the homepage from Figma"
- Multi-frame flows that map to multiple Weaverse pages

Do not use it for live-website cloning (use `cloning-websites-to-weaverse`) or tiny copy edits.

## Required Inputs

- Figma file/frame/node URL (or current selection)
- `.guides/brand-guideline.md`
- `sections.md`
- `app/weaverse/components.ts`

## Required Outputs

Same three deliverables as the website cloning skill:

1. **Content manifest** — per-section table of real asset URLs (from Figma asset export), text, links, Shopify refs, media types.
2. **Clone preview route** — a single `app/routes/clone-preview.$page.tsx` rendering the full design as React + Tailwind, section-marked, brand-adjusted. **User must approve this before section decomposition.**
3. **Design spec** — section mapping, schema boundaries, interaction model, token mapping.

## Extraction with Figma MCP (MCP-first)

Use the Figma MCP tools. They return **structured** design data — more precise than scraped HTML for tokens and layout, and richer on interaction than a rendered frame suggests: states live in component variants and animation values come back as real keyframe data. Never extract by reading a screenshot; that discards every signal below.

> Before any `use_figma` write call, load the `figma-use` skill. For reads below, no write is needed.

1. **Map the structure** — `get_metadata` on the file/frame to get the node tree. Top-level frames/sections become your section-splitting boundaries (the Figma equivalent of HTML section markers).
2. **Extract design tokens** — `get_variable_defs` for colors, typography, spacing, radius. These map directly into `project.config.theme` in the JSON generator (colors → `colorPrimary`/`colorText`/…, type scale → `bodyBaseSize`/`h1BaseSize`/…). This is the biggest advantage over web scraping — tokens are explicit, not inferred.
3. **Read layout + content per frame** — `get_design_context` on each section frame for layout structure, auto-layout direction, text content, and component usage. Auto-layout (horizontal/vertical, wrap, spacing) tells you composition (side-by-side vs stacked vs grid).
4. **Resolve interactive states** — `get_context_for_code_connect` on each interactive component (buttons, cards, nav items, inputs) for its exhaustive variant options. Hover/pressed/disabled are normally variant properties (`State = Default | Hover | …`), not effects — they exist in the file even though they aren't on the frame you rendered. Let the variant set decide which states the section implements.
5. **Pull motion where it exists** — `get_motion_context` (with `recursive: true` for a subtree) on frames that animate. It returns keyframe tracks, easing, and ready-made CSS/motion.dev snippets; use those values verbatim and match them to structure by `data-node-id`. See the extraction reference for the variant-transition gap and its fallback.
6. **Export assets** — `download_assets` (or `get_screenshot` of leaf image nodes) to get real image/icon URLs. These populate the content manifest's image columns. There is no "video src" to extract like in HTML — flag motion/video intent from frame names or prototype notes instead.
7. **Visual reference** — `get_screenshot` of each frame for the approval checkpoint and for verifying the clone preview matches.
8. **Design system reuse** — `search_design_system` / `get_libraries` when the file uses a component library, to understand reusable component intent.

### Plugin fallback

If the MCP can't reach the file or can't export a specific asset (e.g. a flattened group, an unusual export setting), fall back to a Figma agent plugin export and read its output file. MCP is the primary path; use the plugin only to fill a concrete gap, and note in the manifest which assets came from the fallback.

## Workflow

1. Read `.guides/brand-guideline.md` first. Brand guideline beats the design on visual conflicts.
2. Ensure `sections.md` exists and is current before section matching.
3. **Extract** the design with Figma MCP (steps 1–8 above). Save raw context/exports under `.figma/<file>-<frame>.json` (mirrors the cloning skill's `.firecrawl/`).
4. **Map tokens** — turn `get_variable_defs` output into a theme token table for `project.config.theme`.
5. **Build the content manifest** — required deliverable, same columns and rules as the cloning skill. Asset URLs come from `download_assets`, not from guessing.
6. **Generate the clone preview route** at `app/routes/clone-preview.$page.tsx` — React + Tailwind, real assets, brand-adjusted tokens, `{/* === BLOCK NAME === */}` markers per frame.
7. **User approval checkpoint — STOP and wait.** Present the preview URL + a summary (frame/section count, brand overrides, gaps). Do not proceed until the user explicitly approves. Iterate the preview on feedback.
8. **Decompose & match** — split into section-sized blocks (one per top-level frame, usually). Classify media type, composition, layout mechanism, interaction. Then match against `sections.md` using the **layout matching priority** and **deep structural verification** defined in `cloning-websites-to-weaverse` (composition → layout → interaction → content model; then read the candidate section's source to verify aspect ratios, responsive images, split ratios, child types, animation, overlays). Classify as `REUSE_EXISTING`, `ADAPT_EXISTING`, or `CREATE_NEW_REUSABLE_SECTION`.
9. **Implement** with clean schema boundaries: shared tokens → `app/styles/app.css`; sitewide controls → `app/weaverse/schema.server.ts`; section-local → section `schema`. Register new sections in `app/weaverse/components.ts`.
10. **Hand off** the design spec + content manifest + token table to `generating-weaverse-project-json`.
11. **Verify** desktop and mobile, then **delete** the temporary preview route once the Weaverse page matches the approved preview.

## Figma-specific differences from website cloning

| Aspect | Website (Firecrawl) | Figma (MCP) |
|--------|---------------------|-------------|
| Design tokens | inferred from CSS/computed styles | **explicit** via `get_variable_defs` — map directly to theme |
| Section boundaries | HTML section markers, slider/grid classes | top-level frames / auto-layout containers from `get_metadata` |
| Composition | read from HTML positioning | read from **auto-layout** direction/wrap/spacing |
| Assets | image/video URLs in HTML | `download_assets` exports; no real video `src` |
| Interaction states | real `:hover` / `:active` CSS | **component variants** — query `get_context_for_code_connect`, don't read off the frame |
| Animation | real runtime behavior in HTML | **keyframe data** via `get_motion_context` (snippets + easing); variant transitions are the one gap — approximate with a CSS `transition:` |
| Responsive variants | `<picture>` / breakpoint classes | separate desktop/mobile **frames** if the designer made them; otherwise one frame |

## Red Flags

- **Skipping the approval checkpoint** — same rule as website cloning: the user must approve the clone preview before section decomposition.
- **Inventing interactions** — don't classify a frame as a slider just because it shows multiple cards. Confirm from motion context, prototype links, or frame naming.
- **Extracting from screenshots** — reading layout, spacing, or states off a rendered image is what produces flat, static-looking sections. Screenshots are for the approval checkpoint and preview verification only; every layout decision comes from structured tool output.
- **Assuming states don't exist because the frame doesn't show them** — check `get_context_for_code_connect` for variant properties before falling back to a default hover treatment.
- **Rewriting motion values by hand** — `get_motion_context` returns ready CSS/motion.dev snippets; regenerating timing from scratch loses custom bezier and spring fidelity.
- **Ignoring Figma variables** — `get_variable_defs` is the cleanest token source you'll ever get. Hardcoding colors/sizes when variables exist throws away the main Figma advantage.
- **Guessing asset URLs** — export real assets with `download_assets`; mark `MISSING — [describe]` in the manifest when an export fails, don't substitute a placeholder.
- **One giant bespoke section per frame** — decompose into reusable sections; reuse the registry first.
- **Re-deriving the matching rules** — the section-matching priority and deep schema verification live in `cloning-websites-to-weaverse`. Follow them; don't reinvent a looser version.
- **Treating mobile/desktop frames as two pages** — they're responsive variants of the same section; map to `imageMobile`/`imageDesktop` or breakpoint logic, not separate pages.
- **Leaving the preview route in the repo** — delete it after the Weaverse page is verified.

## Related skills

- `cloning-websites-to-weaverse` — the website input adapter; owns the shared section-matching, manifest, and preview rules this skill reuses.
- `generating-weaverse-project-json` — downstream; turns this skill's spec + manifest + token table into import-ready JSON.
- `weaverse-content-api` — push or update content into the live project after import.
- `figma-use` / `figma-generate-design` — Figma MCP plugin skills; load `figma-use` before any `use_figma` write call, including the prototype-`reactions` probe.
- `figma-implement-motion` — load when a section carries real animation; owns the `get_motion_context` merge workflow, easing gotchas, and `prefers-reduced-motion` handling.
