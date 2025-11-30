# SDUI Schema Reference (v2025-01)

The SDUI pipeline uses a **Screen → Section → Component** model inspired by Airbnb's server-driven UI architecture. This document describes the contract so both server builders and agents can compose valid experiences.

## Overview

```
Screen
├── layoutProps (canvas/modal/drawer configuration)
├── sections[] (semantic groupings)
│   ├── header (optional kicker/title/description)
│   └── components[] (UI primitives)
├── actions[] (user-triggerable actions)
└── dataRequirements[] (tRPC procedure declarations)
```

## Screen Envelope

The top-level structure that contains everything:

```json
{
  "id": "dashboard-screen",
  "version": "2025-01",
  "title": "Product Dashboard",
  "description": "Overview of allergen-safe products",
  "layout": "canvas",
  "layoutProps": {
    "tone": "neutral",
    "padding": "lg",
    "width": "wide",
    "overlay": {
      "type": "chat-input",
      "placeholder": "Ask the agent...",
      "quickActions": [...]
    }
  },
  "sections": [...],
  "actions": [...],
  "dataRequirements": [...]
}
```

### Layout Types

| Layout   | Use Case                        | Props                         |
| -------- | ------------------------------- | ----------------------------- |
| `canvas` | Full-screen immersive workspace | tone, padding, width, overlay |
| `modal`  | Focused dialogs                 | size, closable                |
| `drawer` | Side panels                     | side, size, closable          |

## Section Structure

Sections are semantic groupings with optional headers:

```json
{
  "id": "search-results",
  "tone": "default",
  "background": "surface",
  "padding": "lg",
  "gap": "md",
  "width": "default",
  "border": "soft",
  "header": {
    "kicker": "Search Results",
    "title": "Matches for 'oat milk'",
    "description": "6 products found",
    "align": "start"
  },
  "components": [...],
  "actions": ["refresh-results"],
  "dataSource": "products"
}
```

### Section Props

| Prop         | Values                               | Default | Description              |
| ------------ | ------------------------------------ | ------- | ------------------------ |
| `tone`       | default, muted, contrast, accent     | default | Visual emphasis          |
| `background` | transparent, surface, panel, glass   | surface | Background style         |
| `padding`    | none, xs, sm, md, lg, xl             | lg      | Inner spacing            |
| `gap`        | none, xs, sm, md, lg, xl             | md      | Space between components |
| `width`      | narrow, content, default, wide, full | default | Max width constraint     |
| `border`     | none, soft, strong                   | soft    | Border visibility        |

## Component Types

Components are the UI primitives that compose sections.

### Layout Components

| Type     | Purpose                   | Key Props                                     |
| -------- | ------------------------- | --------------------------------------------- |
| `stack`  | Vertical flex container   | gap, padding, align, justify, fullHeight      |
| `inline` | Horizontal flex container | gap, align, justify, wrap                     |
| `grid`   | CSS grid container        | columns, smColumns, mdColumns, lgColumns, gap |
| `card`   | Surface container         | tone, padding, interactive, bordered          |
| `split`  | Two-column layout         | ratio, stackBelow, gap, align                 |

### Typography Components

| Type       | Purpose            | Key Props                                     |
| ---------- | ------------------ | --------------------------------------------- |
| `heading`  | Semantic headings  | text, level, tone, align, weight              |
| `text`     | Body copy          | text, size, tone, emphasis, align, clampLines |
| `richText` | Structured content | nodes[], spacing                              |
| `kicker`   | Eyebrow text       | text, tone                                    |

### Data Components

| Type        | Purpose                | Key Props                             |
| ----------- | ---------------------- | ------------------------------------- |
| `list`      | Data-driven collection | emptyText, orientation, gap           |
| `stat`      | KPI display            | label, value, trend, trendLabel, size |
| `statGroup` | Multiple stats         | orientation, gap                      |
| `badge`     | Status indicator       | text, tone, size                      |

### Interactive Components

| Type          | Purpose             | Key Props                                 |
| ------------- | ------------------- | ----------------------------------------- |
| `button`      | Action trigger      | label, actionId, variant, size, fullWidth |
| `buttonGroup` | Button collection   | orientation, gap                          |
| `skeleton`    | Loading placeholder | variant, lines                            |

### Utility Components

| Type      | Purpose          | Key Props                      |
| --------- | ---------------- | ------------------------------ |
| `divider` | Visual separator | variant, spacing               |
| `spacer`  | Empty space      | size                           |
| `image`   | Media display    | src, alt, aspect, fit, rounded |
| `icon`    | Icon display     | name, size, tone               |

## Data Binding

Components can bind to data requirements using JSONPath-like syntax.

### Declaring Data Requirements

```json
{
  "dataRequirements": [
    {
      "id": "products",
      "procedure": "product.search",
      "input": { "query": "oat milk", "limit": 10 },
      "staleTime": 30000
    }
  ]
}
```

### Binding Props to Data

```json
{
  "type": "list",
  "dataSource": "products",
  "propBindings": {
    "items": "$.data"
  },
  "children": [
    {
      "type": "card",
      "propBindings": {
        "title": "$.name",
        "subtitle": "$.brand"
      }
    }
  ]
}
```

### JSONPath Syntax

- `$` - Root of the data object
- `$.field` - Access a field
- `$.nested.field` - Access nested fields
- `$[0]` - Array index access
- `$.array[0].field` - Combined access

## Actions

Actions are defined at the screen level and referenced by ID:

```json
{
  "actions": [
    {
      "id": "refresh-data",
      "label": "Refresh",
      "variant": "secondary",
      "invocation": {
        "type": "trpc",
        "procedure": "product.search",
        "input": { "query": "oat milk" }
      }
    },
    {
      "id": "open-settings",
      "label": "Settings",
      "variant": "ghost",
      "invocation": {
        "type": "navigate",
        "path": "/settings"
      }
    }
  ]
}
```

### Invocation Types

| Type       | Purpose                | Fields                     |
| ---------- | ---------------------- | -------------------------- |
| `trpc`     | Call a tRPC procedure  | procedure, input           |
| `url`      | HTTP request           | url, method, headers, body |
| `navigate` | Client-side navigation | path, params               |
| `prompt`   | Trigger agent prompt   | text                       |

## Floating Overlay

The canvas layout supports a floating chat input:

```json
{
  "layoutProps": {
    "overlay": {
      "type": "chat-input",
      "placeholder": "Describe what you want to see...",
      "helperText": "Shift + Enter for newline",
      "quickActions": [
        {
          "id": "qa-search",
          "label": "Find products",
          "prompt": "Search for gluten-free snacks"
        }
      ]
    },
    "overlayPlacement": "bottom-center",
    "overlayWidth": "medium"
  }
}
```

## Builder Helpers

The schema exports helper functions for constructing valid structures:

```typescript
import {
  buildComponent,
  buildScreen,
  buildSection,
} from "@acme/api/sdui-schema";

const screen = buildScreen({
  id: "my-screen",
  version: "2025-01",
  sections: [
    buildSection({
      id: "hero",
      components: [
        { id: "title", type: "heading", props: { text: "Hello", level: "1" } },
      ],
    }),
  ],
});
```

## Validation

Use the `/api/sdui/validate` endpoint to validate screens before sending to clients:

```bash
curl -X POST /api/sdui/validate \
  -H "Content-Type: application/json" \
  -d '{ "id": "test", "version": "2025-01", "sections": [...] }'
```

Response:

```json
{
  "valid": true,
  "normalized": {
    /* validated and normalized screen */
  }
}
```

## Schema Metadata API

Query `/api/sdui/schema` for the complete schema reference:

```bash
curl /api/sdui/schema
```

Returns component types, props, data binding examples, and more.
