# SDUI Agent Guide

This guide explains how the AI agent should compose server-driven UI screens for the Traces Known application.

## Tool Selection

The agent has two approaches to building UI:

### High-Level Tools (Recommended for Common Tasks)

Use these when the task fits a standard pattern:

| Tool | When to Use |
|------|-------------|
| `searchProducts` | User wants to find products |
| `getProductDetails` | User wants details on a specific product |
| `getUserAllergens` | User asks about their allergen preferences |
| `showReportForm` | User wants to report a reaction |
| `showRecentReports` | User wants to see community or personal reports |

**Advantages:**
- Automatic data fetching and formatting
- Consistent section structure
- Built-in action wiring

### Low-Level Tools (For Custom Layouts)

Use `compose_screen` or `add_section` when:
- Building a custom dashboard
- Creating a non-standard layout
- Combining multiple data sources in one view
- The high-level tools don't fit the use case

## Composing Screens

### Basic Structure

```json
{
  "id": "custom-dashboard",
  "version": "2025-01",
  "layout": "canvas",
  "layoutProps": {
    "tone": "neutral",
    "padding": "lg",
    "width": "wide"
  },
  "sections": [
    {
      "id": "hero",
      "header": {
        "kicker": "Dashboard",
        "title": "Your Allergen Overview",
        "description": "Personalized insights based on your preferences"
      },
      "components": [...]
    }
  ],
  "actions": [],
  "dataRequirements": []
}
```

### Common Patterns

#### Card Grid

Display multiple items in a responsive grid:

```json
{
  "type": "grid",
  "props": { "columns": 1, "mdColumns": 2, "lgColumns": 3, "gap": "md" },
  "children": [
    {
      "type": "card",
      "props": { "tone": "plain", "interactive": true },
      "children": [
        { "type": "heading", "props": { "text": "Product Name", "level": "5" } },
        { "type": "text", "props": { "text": "Brand name", "tone": "muted" } }
      ]
    }
  ]
}
```

#### Stats Dashboard

Display KPIs with trends:

```json
{
  "type": "inline",
  "props": { "gap": "lg", "wrap": true },
  "children": [
    { "type": "stat", "props": { "label": "Total Products", "value": "1,234", "trend": "up", "trendLabel": "+12%" } },
    { "type": "stat", "props": { "label": "Reports", "value": "567", "trend": "neutral" } },
    { "type": "stat", "props": { "label": "Risk Alerts", "value": "23", "trend": "down", "trendLabel": "-5%" } }
  ]
}
```

#### Data-Bound List

Fetch and display dynamic data:

```json
{
  "dataRequirements": [
    { "id": "products", "procedure": "product.search", "input": { "query": "oat milk" } }
  ],
  "sections": [{
    "id": "results",
    "components": [{
      "type": "list",
      "dataSource": "products",
      "propBindings": { "items": "$.data" },
      "props": { "emptyText": "No products found" },
      "children": [{
        "type": "card",
        "propBindings": { "title": "$.name", "subtitle": "$.brand" }
      }]
    }]
  }]
}
```

#### Split Layout

Two-column responsive layout:

```json
{
  "type": "split",
  "props": { "ratio": "2:1", "stackBelow": "md", "gap": "lg" },
  "children": [
    {
      "type": "stack",
      "children": [
        { "type": "heading", "props": { "text": "Main Content", "level": "2" } },
        { "type": "text", "props": { "text": "Detailed information goes here..." } }
      ]
    },
    {
      "type": "card",
      "props": { "tone": "muted" },
      "children": [
        { "type": "heading", "props": { "text": "Sidebar", "level": "4" } }
      ]
    }
  ]
}
```

## Data Binding

### Declaring Requirements

Data requirements declare tRPC procedures to fetch:

```json
{
  "dataRequirements": [
    {
      "id": "my-data",
      "procedure": "product.search",
      "input": { "query": "gluten free" },
      "staleTime": 30000
    }
  ]
}
```

### Binding to Components

Use `dataSource` and `propBindings`:

```json
{
  "type": "text",
  "dataSource": "my-data",
  "propBindings": {
    "text": "$.results[0].name"
  }
}
```

### JSONPath Reference

- `$` - Root object
- `$.field` - Access field
- `$.nested.field` - Nested access
- `$[0]` - Array index
- `$.array[0].field` - Combined

## Action Wiring

### Defining Actions

```json
{
  "actions": [
    {
      "id": "refresh",
      "label": "Refresh",
      "variant": "secondary",
      "invocation": {
        "type": "trpc",
        "procedure": "product.search",
        "input": { "query": "oat milk" }
      }
    }
  ]
}
```

### Referencing in Sections

```json
{
  "id": "results-section",
  "actions": ["refresh"],
  "components": [...]
}
```

### In Buttons

```json
{
  "type": "button",
  "props": {
    "label": "Refresh Data",
    "actionId": "refresh",
    "variant": "secondary"
  }
}
```

## Form Composition

### Creating Forms

Forms are dynamically composed using form components. Use the MCP servers to understand:
1. **What fields are needed** - Query tRPC MCP for procedure input schemas
2. **What inputs to use** - Query SDUI MCP for available form components

### Form Structure

```json
{
  "type": "form",
  "props": {
    "actionId": "submit-report",
    "submitLabel": "Submit Report",
    "submitVariant": "primary"
  },
  "children": [
    {
      "type": "formField",
      "props": { "name": "productId", "label": "Product", "required": true },
      "children": [
        { "type": "textInput", "props": { "name": "productId", "placeholder": "Product ID" } }
      ]
    },
    {
      "type": "formField",
      "props": { "name": "severity", "label": "Severity", "required": true },
      "children": [
        {
          "type": "select",
          "props": {
            "name": "severity",
            "placeholder": "Select severity",
            "options": [
              { "value": "LOW", "label": "Low - Mild discomfort" },
              { "value": "MEDIUM", "label": "Medium - Noticeable reaction" },
              { "value": "HIGH", "label": "High - Severe reaction" }
            ]
          }
        }
      ]
    }
  ]
}
```

### Form Components

| Component | Use Case |
|-----------|----------|
| `form` | Container that handles submission |
| `formField` | Wrapper with label, hint, and error |
| `textInput` | Single-line text (text, email, password, number) |
| `textarea` | Multi-line text |
| `select` | Dropdown selection |
| `checkbox` | Boolean choice |
| `radio` | Single selection from options |
| `dateInput` | Date picker |
| `fileUpload` | File attachment |
| `rating` | Star rating (1-10) |
| `slider` | Numeric range |

### Mapping Procedure Inputs to Form Fields

When building a form for a tRPC mutation:

1. Query the procedure schema: `get_procedure({ name: "report.create" })`
2. Map each input field to an appropriate form component:
   - `string` → `textInput` or `textarea` (for descriptions/comments)
   - `string` with `enum` → `select`
   - `boolean` → `checkbox`
   - `number` → `textInput` with `inputType: "number"` or `slider`
   - `array` of `string` → `textarea` (one per line)
   - `string` with `format: "date-time"` → `dateInput`
   - `string` with `format: "uuid"` → `textInput` (for IDs)

### Form Actions

Connect forms to tRPC mutations:

```json
{
  "actions": [
    {
      "id": "submit-report",
      "label": "Submit",
      "variant": "primary",
      "invocation": {
        "type": "trpc",
        "procedure": "report.create"
      }
    }
  ]
}
```

The form automatically collects all field values and passes them as input to the action.

### Example: Report Form

Building a complete reaction report form:

```json
{
  "id": "report-form-screen",
  "version": "2025-01",
  "layout": "canvas",
  "sections": [{
    "id": "report-section",
    "header": {
      "kicker": "Community Safety",
      "title": "Report a Reaction",
      "description": "Help others by sharing your experience"
    },
    "components": [{
      "type": "form",
      "id": "report-form",
      "props": {
        "actionId": "create-report",
        "submitLabel": "Submit Report",
        "resetLabel": "Clear"
      },
      "children": [
        {
          "type": "formField",
          "id": "field-product",
          "props": { "name": "productId", "label": "Product", "required": true, "hint": "ID of the product" },
          "children": [
            { "type": "textInput", "id": "input-product", "props": { "name": "productId", "placeholder": "Product ID" } }
          ]
        },
        {
          "type": "formField",
          "id": "field-severity",
          "props": { "name": "severity", "label": "Severity", "required": true },
          "children": [
            {
              "type": "select",
              "id": "input-severity",
              "props": {
                "name": "severity",
                "placeholder": "Select severity level",
                "options": [
                  { "value": "LOW", "label": "Low - Mild discomfort" },
                  { "value": "MEDIUM", "label": "Medium - Noticeable reaction" },
                  { "value": "HIGH", "label": "High - Severe reaction" }
                ]
              }
            }
          ]
        },
        {
          "type": "formField",
          "id": "field-comment",
          "props": { "name": "comment", "label": "Additional Details" },
          "children": [
            { "type": "textarea", "id": "input-comment", "props": { "name": "comment", "placeholder": "Describe your experience...", "rows": 4 } }
          ]
        }
      ]
    }]
  }],
  "actions": [{
    "id": "create-report",
    "label": "Submit Report",
    "variant": "primary",
    "invocation": { "type": "trpc", "procedure": "report.create" }
  }]
}
```

## Using MCP Servers

The agent has access to two MCP servers for component and data discovery:

### SDUI MCP - Component Discovery

Query available components and patterns:

- `list_components({ category?: "form" })` - Get all form components
- `get_component({ type: "select" })` - Get detailed props for select
- `get_pattern({ name: "report-form" })` - Get a reusable pattern
- `list_patterns({ category?: "form" })` - Get all form patterns

### tRPC MCP - Procedure Discovery

Query available procedures and schemas:

- `list_procedures({ router?: "report" })` - Get report procedures
- `get_procedure({ name: "report.create" })` - Get input/output schema
- `get_form_fields({ procedure: "report.create" })` - Get recommended form fields

### Workflow Example

To create a form for any procedure:

1. **Get the procedure schema:**
   ```
   get_procedure({ name: "report.create" })
   ```

2. **Get recommended form fields:**
   ```
   get_form_fields({ procedure: "report.create" })
   ```
   This returns a mapping of fields to recommended components.

3. **Compose the form** using the field recommendations.

## Best Practices

### Do

- Use high-level tools for standard tasks
- Keep sections focused and semantic
- Use appropriate tones (default for content, muted for secondary, accent for emphasis)
- Include headers with kicker/title/description for context
- Use responsive grid columns (1 → 2 → 3)
- Query MCP servers to understand available components
- Map procedure input schemas to form fields
- Always wrap form inputs in `formField` for labels and validation

### Don't

- Create deeply nested component trees (max 4 levels)
- Mix unrelated content in one section
- Use accent tone excessively
- Forget to include empty states for lists
- Create screens without meaningful IDs
- Hardcode forms when you can compose them dynamically
- Skip form validation by omitting required flags

## Error Handling

If the high-level tools fail, fall back gracefully:

```json
{
  "sections": [{
    "id": "error",
    "tone": "muted",
    "header": {
      "title": "Unable to load data",
      "description": "Please try again or ask a different question"
    },
    "components": [
      { "type": "button", "props": { "label": "Retry", "actionId": "retry" } }
    ]
  }]
}
```

## Quick Reference

### Component Categories

| Category | Types |
|----------|-------|
| Layout | stack, inline, grid, card, split |
| Typography | heading, text, richText, kicker |
| Data | list, stat, statGroup, badge |
| Media | image, icon |
| Interactive | button, buttonGroup, skeleton |
| Form | form, formField, textInput, textarea, select, checkbox, radio, dateInput, fileUpload, rating, slider |
| Utility | divider, spacer |

### Tone Meanings

| Tone | Use Case |
|------|----------|
| default | Primary content |
| muted | Secondary/supporting info |
| accent | Emphasis, calls to action |
| contrast | High-visibility sections |

### Size Scales

| Scale | Use Case |
|-------|----------|
| xs | Metadata, fine print |
| sm | Secondary text, captions |
| md | Body text (default) |
| lg | Emphasized text |
| xl | Large display text |

