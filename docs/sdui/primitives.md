# SDUI Component Primitives

This document describes the UI primitives available in the SDUI system. All components map to React components in `packages/ui` and are rendered by the client-side `SduiRenderer`.

## Architecture

```
Schema (JSON)          →  Registry (mapping)  →  UI Components (React)
├── type: "stack"      →  StackRenderer       →  <Stack />
├── type: "heading"    →  HeadingRenderer     →  <Heading />
└── type: "list"       →  ListRenderer        →  <Stack> + data binding
```

## Layout Primitives

### Stack

Vertical flex container for arranging children in a column.

```json
{
  "type": "stack",
  "props": {
    "gap": "md",
    "padding": "none",
    "align": "stretch",
    "justify": "start",
    "fullHeight": false
  },
  "children": [...]
}
```

**Maps to:** `packages/ui/src/layout.tsx → Stack`

### Inline

Horizontal flex container for arranging children in a row.

```json
{
  "type": "inline",
  "props": {
    "gap": "sm",
    "align": "center",
    "justify": "start",
    "wrap": false
  },
  "children": [...]
}
```

**Maps to:** `packages/ui/src/layout.tsx → Inline`

### Grid

CSS grid container for responsive multi-column layouts.

```json
{
  "type": "grid",
  "props": {
    "columns": 1,
    "smColumns": 2,
    "mdColumns": 3,
    "lgColumns": 4,
    "gap": "md",
    "equalHeight": false
  },
  "children": [...]
}
```

**Maps to:** `packages/ui/src/layout.tsx → Grid`

### Card

Surface container with tone and interaction options.

```json
{
  "type": "card",
  "props": {
    "tone": "plain",
    "padding": "md",
    "interactive": false,
    "bordered": true
  },
  "children": [...]
}
```

**Maps to:** `packages/ui/src/layout.tsx → Surface`

### Split

Two-column responsive layout with configurable ratio.

```json
{
  "type": "split",
  "props": {
    "ratio": "2:1",
    "stackBelow": "md",
    "gap": "md",
    "align": "stretch"
  },
  "children": [
    /* exactly 2 children */
  ]
}
```

**Maps to:** `packages/ui/src/section.tsx → Split`

## Typography Primitives

### Heading

Semantic heading with level, tone, and alignment.

```json
{
  "type": "heading",
  "props": {
    "text": "Section Title",
    "level": "3",
    "tone": "default",
    "align": "start",
    "weight": "semibold"
  }
}
```

**Maps to:** `packages/ui/src/typography.tsx → Heading`

### Text

Body text with size, tone, and emphasis options.

```json
{
  "type": "text",
  "props": {
    "text": "Body content goes here.",
    "size": "md",
    "tone": "default",
    "emphasis": "none",
    "align": "start",
    "clampLines": 3
  }
}
```

**Maps to:** `packages/ui/src/typography.tsx → Text`

### Kicker

Eyebrow text for section headers.

```json
{
  "type": "kicker",
  "props": {
    "text": "FEATURED",
    "tone": "muted"
  }
}
```

**Maps to:** `packages/ui/src/typography.tsx → Kicker`

### RichText

Structured text with formatting nodes.

```json
{
  "type": "richText",
  "props": {
    "spacing": "normal",
    "nodes": [
      {
        "type": "paragraph",
        "spans": [
          { "text": "Normal text ", "marks": [] },
          { "text": "bold text", "marks": ["bold"] }
        ]
      },
      {
        "type": "heading",
        "text": "Subheading",
        "level": "4"
      },
      {
        "type": "list",
        "ordered": false,
        "items": ["Item one", "Item two"]
      }
    ]
  }
}
```

**Maps to:** `packages/ui/src/rich-text.tsx → RichTextBlock`

## Data Primitives

### List

Data-driven collection with item template and data binding.

```json
{
  "type": "list",
  "dataSource": "products",
  "propBindings": { "items": "$.data" },
  "props": {
    "emptyText": "No items found",
    "orientation": "vertical",
    "gap": "md"
  },
  "children": [
    {
      "type": "card",
      "propBindings": { "title": "$.name" }
    }
  ]
}
```

**Rendering behavior:**

1. Fetches data from `dataSource`
2. Shows skeleton while loading
3. Shows `emptyText` if no items
4. Clones `children[0]` for each item with bindings resolved

### Stat

Key performance indicator display.

```json
{
  "type": "stat",
  "props": {
    "label": "Total Products",
    "value": "1,234",
    "trend": "up",
    "trendLabel": "+12%",
    "size": "md"
  }
}
```

**Renders:** Label, large value, and optional trend indicator with color coding.

### StatGroup

Container for multiple stats.

```json
{
  "type": "statGroup",
  "props": {
    "orientation": "horizontal",
    "gap": "lg"
  },
  "children": [
    { "type": "stat", "props": { "label": "A", "value": "100" } },
    { "type": "stat", "props": { "label": "B", "value": "200" } }
  ]
}
```

### Badge

Status indicator or tag.

```json
{
  "type": "badge",
  "props": {
    "text": "HIGH",
    "tone": "danger",
    "size": "sm"
  }
}
```

**Maps to:** `packages/ui/src/badge.tsx → Badge`

## Interactive Primitives

### Button

Action trigger with action binding.

```json
{
  "type": "button",
  "props": {
    "label": "Click Me",
    "actionId": "my-action",
    "variant": "primary",
    "size": "md",
    "fullWidth": false
  }
}
```

**Maps to:** `packages/ui/src/button.tsx → Button`

**Action binding:** When `actionId` is set, clicking invokes the action defined at screen level.

### ButtonGroup

Container for related buttons.

```json
{
  "type": "buttonGroup",
  "props": {
    "orientation": "horizontal",
    "gap": "sm"
  },
  "children": [
    { "type": "button", "props": { "label": "Save", "variant": "primary" } },
    { "type": "button", "props": { "label": "Cancel", "variant": "ghost" } }
  ]
}
```

### Skeleton

Loading placeholder.

```json
{
  "type": "skeleton",
  "props": {
    "variant": "text",
    "lines": 3
  }
}
```

**Variants:** text, heading, card, image, stat

## Utility Primitives

### Divider

Visual separator.

```json
{
  "type": "divider",
  "props": {
    "variant": "solid",
    "spacing": "md"
  }
}
```

**Maps to:** `packages/ui/src/section.tsx → Divider`

### Spacer

Empty space for layout control.

```json
{
  "type": "spacer",
  "props": {
    "size": "lg"
  }
}
```

### Image

Media display.

```json
{
  "type": "image",
  "props": {
    "src": "/images/product.jpg",
    "alt": "Product image",
    "aspect": "video",
    "fit": "cover",
    "rounded": true
  }
}
```

### Icon

Icon display (placeholder implementation).

```json
{
  "type": "icon",
  "props": {
    "name": "search",
    "size": "md",
    "tone": "default"
  }
}
```

## Children Constraints

Not all components accept children:

| Component   | Accepts Children  |
| ----------- | ----------------- |
| stack       | ✓                 |
| inline      | ✓                 |
| grid        | ✓                 |
| card        | ✓                 |
| split       | ✓ (exactly 2)     |
| list        | ✓ (item template) |
| statGroup   | ✓                 |
| buttonGroup | ✓                 |
| heading     | ✗                 |
| text        | ✗                 |
| richText    | ✗                 |
| kicker      | ✗                 |
| stat        | ✗                 |
| badge       | ✗                 |
| button      | ✗                 |
| skeleton    | ✗                 |
| divider     | ✗                 |
| spacer      | ✗                 |
| image       | ✗                 |
| icon        | ✗                 |

## Size & Spacing Scales

All spacing props use a consistent scale:

| Value | Pixels | Tailwind |
| ----- | ------ | -------- |
| none  | 0      | gap-0    |
| xs    | 6px    | gap-1.5  |
| sm    | 12px   | gap-3    |
| md    | 16px   | gap-4    |
| lg    | 24px   | gap-6    |
| xl    | 32px   | gap-8    |

## Tone Meanings

| Tone    | Color      | Use Case        |
| ------- | ---------- | --------------- |
| default | Foreground | Primary content |
| muted   | Gray       | Secondary info  |
| accent  | Brand      | Emphasis        |
| success | Green      | Positive        |
| warning | Amber      | Caution         |
| danger  | Red        | Error/alert     |
