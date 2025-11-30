# SDUI Primitive Inventory

_Last updated: Nov 30, 2025_

This document captures the typography and layout primitives that the server-driven UI (SDUI) system can compose. It extends the existing shadcn-based kit with immersive canvas building blocks inspired by [Airbnb's SDUI architecture](https://medium.com/airbnb-engineering/a-deep-dive-into-airbnbs-server-driven-ui-system-842244c5f5). The goal is to provide the agent with reliable atoms that can be combined into arbitrarily rich canvases while keeping the floating chat input decoupled.

## Inventory

| Category    | Component        | Purpose                                                                 | Compatible children                                          |
| ----------- | ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| Typography  | `Heading`        | Semantic headings across `display` – `h6` levels with tone + alignment. | Inline nodes (`Text`, `Kicker`, icons) only.                  |
| Typography  | `Text`           | Flexible body text with size, tone, emphasis, wrapping + line clamp.   | Inline-only elements. Avoid nesting layout primitives.       |
| Typography  | `Kicker`         | Uppercase label / section kicker.                                      | Inline text; typically paired with `Heading` + `Text`.       |
| Typography  | `Prose`          | Rich-text wrapper (markdown, longform copy, generated docs).           | Any typography primitives; no layout primitives inside.      |
| Layout      | `Stack`          | Vertical flex stack with spacing, padding, borders, radii, shadows.    | Typography, layout, media, actions. Avoid placing `Canvas` inside. |
| Layout      | `Inline`         | Horizontal flex row with wrapping + dividers.                          | Typography, buttons, icon chips; keep children lightweight.  |
| Layout      | `Grid`           | Responsive grid (1–12 cols) with per-breakpoint templates.             | Cards, Surface, Stack, media blocks. Child height equalization optional. |
| Layout      | `Surface`        | Rounded container with tone, padding, blur, interaction affordances.   | Any layout/typography except `Canvas`. Often parented by `Grid`/`Stack`. |
| Layout      | `Canvas`         | Immersive backdrop w/ gradients, scroll control, sticky header + floating overlay slot. | High-level layout root. Contains `Stack`/`Grid`/`Surface`. Accepts floating chat input via `floatingOverlay`. |

Legacy primitives (Button, Card, Input, Badge, etc.) remain available for SDUI compositions but are omitted here since they were already documented elsewhere in the design system.

## Compatibility Rules

1. **Single Canvas root:** Every SDUI payload should declare exactly one `Canvas` element to own background, scrolling, and floating overlay placement. Nested canvases are disallowed; use `Surface` if you need inset panels.
2. **Layout > Typography hierarchy:** Only layout primitives (`Stack`, `Inline`, `Grid`, `Surface`) may parent other layout primitives. Typography atoms should be leaves or grouped inside layout containers.
3. **Floating input overlay:** `Canvas` exposes `floatingOverlay` + `overlayPlacement` so the chat composer can float independently of the rendered modules. Whatever component populates this slot must manage its own interactive state and avoid full-width layouts.
4. **Action zones:** Buttons, form controls, and other interactive elements should live inside `Surface`, `Stack`, or `Inline` containers to preserve padding contracts. Avoid attaching actions directly to `Canvas`.
5. **Rich text safety:** `Prose` is intended for trusted markdown that the server has already sanitized. Generated HTML must be validated before injection to prevent scriptable payloads.

## Theming & Immersive Requirements

- `Canvas` tone presets (`neutral`, `dusk`, `aurora`, `paper`) give the agent predictable visual moods without hand-authoring gradients.
- `Surface` offers blur + accent states for “glass” cards referenced in the article; use `interaction="interactive"` for panels that react to hover/focus.
- `Stack`/`Inline` deliver consistent gap and padding scales so the server can reason about spacing numerically instead of using raw class strings.
- Sticky headers (via `Canvas.stickyHeader`) let the agent anchor context such as user info or live stats while the rest of the canvas scrolls.

This inventory will feed directly into the SDUI schema so the agent (or an MCP data source) can query which primitives exist, what props are supported, and how they may be composed.

