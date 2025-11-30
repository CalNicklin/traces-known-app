/**
 * SDUI MCP Server
 *
 * Exposes the SDUI component system to AI agents, enabling them to:
 * - Discover available components and their props
 * - Understand nesting rules and composition patterns
 * - Learn data binding capabilities
 * - Compose dynamic UI screens
 */

import { COMPONENT_CHILDREN_ALLOWED } from "../sdui-schema";

// =============================================================================
// Component Categories
// =============================================================================

type ComponentCategory =
  | "layout"
  | "typography"
  | "data"
  | "media"
  | "interactive"
  | "form"
  | "utility";

const COMPONENT_CATEGORIES: Record<string, ComponentCategory> = {
  // Layout
  stack: "layout",
  inline: "layout",
  grid: "layout",
  card: "layout",
  split: "layout",
  // Typography
  heading: "typography",
  text: "typography",
  richText: "typography",
  kicker: "typography",
  // Data display
  list: "data",
  stat: "data",
  statGroup: "data",
  badge: "data",
  // Media
  image: "media",
  icon: "media",
  // Interactive
  button: "interactive",
  buttonGroup: "interactive",
  skeleton: "interactive",
  // Form (will be added)
  form: "form",
  formField: "form",
  textInput: "form",
  textarea: "form",
  select: "form",
  checkbox: "form",
  radio: "form",
  dateInput: "form",
  fileUpload: "form",
  rating: "form",
  slider: "form",
  // Utility
  divider: "utility",
  spacer: "utility",
};

// =============================================================================
// Component Descriptions
// =============================================================================

const COMPONENT_DESCRIPTIONS: Record<string, string> = {
  // Layout
  stack: "Vertical flex container for stacking children",
  inline: "Horizontal flex container for inline elements",
  grid: "CSS Grid container with responsive columns",
  card: "Container with background, border, and optional interaction",
  split: "Two-column layout with configurable ratio",
  // Typography
  heading: "Semantic heading element (h1-h6 or display)",
  text: "Body text with size and tone variants",
  richText: "Formatted text with paragraphs, lists, and styling",
  kicker: "Small uppercase label text",
  // Data
  list: "Data-bound list that iterates over items",
  stat: "Single statistic with label, value, and optional trend",
  statGroup: "Container for multiple stats",
  badge: "Small label/tag component",
  // Media
  image: "Responsive image with aspect ratio control",
  icon: "Icon from icon library",
  // Interactive
  button: "Clickable button that triggers actions",
  buttonGroup: "Container for grouping buttons",
  skeleton: "Loading placeholder",
  // Form
  form: "Form container that collects input values and submits via action",
  formField: "Field wrapper with label, hint, and error display",
  textInput: "Single-line text input",
  textarea: "Multi-line text input",
  select: "Dropdown select with options",
  checkbox: "Boolean checkbox input",
  radio: "Radio button group for single selection",
  dateInput: "Date picker input",
  fileUpload: "File upload input",
  rating: "Star rating input",
  slider: "Range slider input",
  // Utility
  divider: "Visual separator line",
  spacer: "Empty space for layout",
};

// =============================================================================
// Typical Children Suggestions
// =============================================================================

const TYPICAL_CHILDREN: Record<string, string[]> = {
  stack: ["heading", "text", "card", "inline", "divider", "button"],
  inline: ["text", "badge", "button", "icon"],
  grid: ["card", "stat"],
  card: ["stack", "heading", "text", "badge", "button", "inline"],
  split: ["stack", "card"],
  list: ["card", "inline", "stack"],
  statGroup: ["stat"],
  buttonGroup: ["button"],
  form: ["formField", "button"],
  formField: [
    "textInput",
    "textarea",
    "select",
    "checkbox",
    "radio",
    "dateInput",
    "rating",
    "slider",
  ],
};

// =============================================================================
// Props Schema to JSON Schema Converter
// =============================================================================

interface JsonSchemaProperty {
  type?: string;
  enum?: string[];
  default?: unknown;
  description?: string;
  minimum?: number;
  maximum?: number;
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

function _zodToJsonSchema(
  _schema: unknown,
): Record<string, JsonSchemaProperty> {
  // This is a simplified converter - in production you'd use zod-to-json-schema
  // For now, return manually defined schemas for each component type
  return {};
}

// =============================================================================
// Component Props Documentation
// =============================================================================

interface PropDoc {
  type: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  required?: boolean;
  minimum?: number;
  maximum?: number;
}

const COMPONENT_PROPS: Record<string, Record<string, PropDoc>> = {
  // Layout
  stack: {
    gap: {
      type: "enum",
      enum: ["none", "xs", "sm", "md", "lg", "xl"],
      default: "md",
      description: "Space between children",
    },
    padding: {
      type: "enum",
      enum: ["none", "xs", "sm", "md", "lg", "xl"],
      default: "none",
      description: "Internal padding",
    },
    align: {
      type: "enum",
      enum: ["start", "center", "end", "stretch"],
      default: "stretch",
      description: "Cross-axis alignment",
    },
    justify: {
      type: "enum",
      enum: ["start", "center", "end", "between"],
      default: "start",
      description: "Main-axis alignment",
    },
    fullHeight: {
      type: "boolean",
      default: false,
      description: "Expand to fill available height",
    },
  },
  inline: {
    gap: {
      type: "enum",
      enum: ["none", "xs", "sm", "md", "lg", "xl"],
      default: "sm",
    },
    align: {
      type: "enum",
      enum: ["start", "center", "end", "stretch"],
      default: "center",
    },
    justify: {
      type: "enum",
      enum: ["start", "center", "end", "between"],
      default: "start",
    },
    wrap: {
      type: "boolean",
      default: false,
      description: "Allow wrapping to next line",
    },
  },
  grid: {
    columns: {
      type: "number",
      minimum: 1,
      maximum: 12,
      default: 1,
      description: "Base column count",
    },
    smColumns: {
      type: "number",
      minimum: 1,
      maximum: 12,
      description: "Columns at sm breakpoint",
    },
    mdColumns: {
      type: "number",
      minimum: 1,
      maximum: 12,
      description: "Columns at md breakpoint",
    },
    lgColumns: {
      type: "number",
      minimum: 1,
      maximum: 12,
      description: "Columns at lg breakpoint",
    },
    gap: {
      type: "enum",
      enum: ["none", "xs", "sm", "md", "lg", "xl"],
      default: "md",
    },
    equalHeight: {
      type: "boolean",
      default: false,
      description: "Make all items same height",
    },
  },
  card: {
    tone: {
      type: "enum",
      enum: ["plain", "muted", "accent", "elevated", "subtle"],
      default: "plain",
      description: "Visual style",
    },
    padding: {
      type: "enum",
      enum: ["none", "sm", "md", "lg", "xl"],
      default: "md",
    },
    interactive: {
      type: "boolean",
      default: false,
      description: "Show hover/focus states",
    },
    bordered: { type: "boolean", default: true, description: "Show border" },
  },
  split: {
    ratio: {
      type: "enum",
      enum: ["1:1", "2:1", "1:2", "3:2", "2:3", "3:1", "1:3"],
      default: "1:1",
      description: "Column width ratio",
    },
    stackBelow: {
      type: "enum",
      enum: ["sm", "md", "lg", "xl", "never"],
      default: "md",
      description: "Stack vertically below breakpoint",
    },
    gap: {
      type: "enum",
      enum: ["none", "xs", "sm", "md", "lg", "xl"],
      default: "md",
    },
    align: {
      type: "enum",
      enum: ["start", "center", "end", "stretch"],
      default: "stretch",
    },
  },
  // Typography
  heading: {
    text: {
      type: "string",
      required: true,
      description: "Heading text content",
    },
    level: {
      type: "enum",
      enum: ["display", "1", "2", "3", "4", "5", "6"],
      default: "3",
      description: "Semantic heading level",
    },
    tone: {
      type: "enum",
      enum: ["default", "muted", "accent"],
      default: "default",
    },
    align: { type: "enum", enum: ["start", "center", "end"], default: "start" },
    weight: {
      type: "enum",
      enum: ["light", "normal", "medium", "semibold", "bold"],
      description: "Font weight override",
    },
  },
  text: {
    text: { type: "string", required: true, description: "Text content" },
    size: { type: "enum", enum: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    tone: {
      type: "enum",
      enum: ["default", "muted", "accent", "success", "warning", "danger"],
      default: "default",
    },
    emphasis: {
      type: "enum",
      enum: ["none", "medium", "strong"],
      default: "none",
    },
    align: {
      type: "enum",
      enum: ["start", "center", "end", "justify"],
      default: "start",
    },
    clampLines: {
      type: "number",
      minimum: 1,
      maximum: 10,
      description: "Truncate after N lines",
    },
  },
  kicker: {
    text: {
      type: "string",
      required: true,
      description: "Kicker text content",
    },
    tone: {
      type: "enum",
      enum: ["default", "muted", "accent"],
      default: "muted",
    },
  },
  // Data
  list: {
    emptyText: {
      type: "string",
      default: "No items",
      description: "Text when list is empty",
    },
    orientation: {
      type: "enum",
      enum: ["vertical", "horizontal"],
      default: "vertical",
    },
    gap: {
      type: "enum",
      enum: ["none", "xs", "sm", "md", "lg", "xl"],
      default: "md",
    },
  },
  stat: {
    label: { type: "string", required: true, description: "Stat label" },
    value: { type: "string", required: true, description: "Stat value" },
    previousValue: {
      type: "string",
      description: "Previous value for comparison",
    },
    trend: {
      type: "enum",
      enum: ["up", "down", "neutral"],
      description: "Trend direction",
    },
    trendLabel: { type: "string", description: "Trend description text" },
    size: { type: "enum", enum: ["sm", "md", "lg"], default: "md" },
  },
  statGroup: {
    orientation: {
      type: "enum",
      enum: ["horizontal", "vertical"],
      default: "horizontal",
    },
    gap: {
      type: "enum",
      enum: ["none", "xs", "sm", "md", "lg", "xl"],
      default: "lg",
    },
  },
  badge: {
    text: { type: "string", required: true, description: "Badge text" },
    tone: {
      type: "enum",
      enum: ["default", "muted", "accent", "success", "warning", "danger"],
      default: "default",
    },
    size: { type: "enum", enum: ["sm", "md"], default: "sm" },
  },
  // Media
  image: {
    src: { type: "string", required: true, description: "Image URL" },
    alt: {
      type: "string",
      required: true,
      description: "Alt text for accessibility",
    },
    aspect: {
      type: "enum",
      enum: ["auto", "square", "video", "wide"],
      default: "auto",
    },
    fit: { type: "enum", enum: ["cover", "contain", "fill"], default: "cover" },
    rounded: {
      type: "boolean",
      default: false,
      description: "Apply rounded corners",
    },
  },
  icon: {
    name: {
      type: "string",
      required: true,
      description: "Icon name from library",
    },
    size: { type: "enum", enum: ["xs", "sm", "md", "lg", "xl"], default: "md" },
    tone: {
      type: "enum",
      enum: ["default", "muted", "accent", "success", "warning", "danger"],
      default: "default",
    },
  },
  // Interactive
  button: {
    label: { type: "string", required: true, description: "Button text" },
    actionId: {
      type: "string",
      description: "ID of action to invoke on click",
    },
    variant: {
      type: "enum",
      enum: ["primary", "secondary", "ghost", "link", "destructive"],
      default: "secondary",
    },
    size: { type: "enum", enum: ["sm", "md", "lg"], default: "md" },
    icon: { type: "string", description: "Optional icon name" },
    iconPosition: { type: "enum", enum: ["start", "end"], default: "start" },
    fullWidth: {
      type: "boolean",
      default: false,
      description: "Expand to full width",
    },
  },
  buttonGroup: {
    orientation: {
      type: "enum",
      enum: ["horizontal", "vertical"],
      default: "horizontal",
    },
    gap: {
      type: "enum",
      enum: ["none", "xs", "sm", "md", "lg", "xl"],
      default: "sm",
    },
  },
  skeleton: {
    variant: {
      type: "enum",
      enum: ["text", "heading", "card", "image", "stat"],
      default: "text",
    },
    lines: {
      type: "number",
      minimum: 1,
      maximum: 10,
      default: 1,
      description: "Number of skeleton lines",
    },
  },
  // Form
  form: {
    actionId: {
      type: "string",
      required: true,
      description: "ID of action to invoke on submit",
    },
    submitLabel: {
      type: "string",
      default: "Submit",
      description: "Submit button text",
    },
    resetLabel: {
      type: "string",
      description: "Reset button text (omit to hide)",
    },
  },
  formField: {
    name: {
      type: "string",
      required: true,
      description: "Field name matching procedure input",
    },
    label: { type: "string", required: true, description: "Field label text" },
    hint: { type: "string", description: "Help text below input" },
    required: {
      type: "boolean",
      default: false,
      description: "Mark as required",
    },
  },
  textInput: {
    name: { type: "string", required: true, description: "Field name" },
    placeholder: { type: "string", description: "Placeholder text" },
    inputType: {
      type: "enum",
      enum: ["text", "email", "password", "number", "tel", "url"],
      default: "text",
    },
    defaultValue: { type: "string", description: "Initial value" },
  },
  textarea: {
    name: { type: "string", required: true, description: "Field name" },
    placeholder: { type: "string", description: "Placeholder text" },
    rows: {
      type: "number",
      minimum: 2,
      maximum: 20,
      default: 4,
      description: "Visible rows",
    },
    defaultValue: { type: "string", description: "Initial value" },
  },
  select: {
    name: { type: "string", required: true, description: "Field name" },
    placeholder: { type: "string", description: "Placeholder text" },
    options: {
      type: "array",
      description: "Array of { value, label } objects",
      required: true,
    },
    defaultValue: { type: "string", description: "Initial selected value" },
  },
  checkbox: {
    name: { type: "string", required: true, description: "Field name" },
    label: { type: "string", required: true, description: "Checkbox label" },
    defaultChecked: {
      type: "boolean",
      default: false,
      description: "Initial checked state",
    },
  },
  radio: {
    name: { type: "string", required: true, description: "Field name" },
    options: {
      type: "array",
      description: "Array of { value, label } objects",
      required: true,
    },
    defaultValue: { type: "string", description: "Initial selected value" },
  },
  dateInput: {
    name: { type: "string", required: true, description: "Field name" },
    placeholder: { type: "string", description: "Placeholder text" },
    minDate: { type: "string", description: "Minimum date (ISO format)" },
    maxDate: { type: "string", description: "Maximum date (ISO format)" },
    defaultValue: { type: "string", description: "Initial date value" },
  },
  fileUpload: {
    name: { type: "string", required: true, description: "Field name" },
    accept: {
      type: "string",
      description: "Accepted file types (e.g., 'image/*')",
    },
    multiple: {
      type: "boolean",
      default: false,
      description: "Allow multiple files",
    },
    maxSize: { type: "number", description: "Max file size in bytes" },
  },
  rating: {
    name: { type: "string", required: true, description: "Field name" },
    max: {
      type: "number",
      minimum: 3,
      maximum: 10,
      default: 5,
      description: "Maximum rating value",
    },
    defaultValue: { type: "number", description: "Initial rating" },
  },
  slider: {
    name: { type: "string", required: true, description: "Field name" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    step: { type: "number", default: 1, description: "Step increment" },
    defaultValue: { type: "number", description: "Initial value" },
  },
  // Utility
  divider: {
    variant: {
      type: "enum",
      enum: ["solid", "dashed", "glow"],
      default: "solid",
    },
    spacing: {
      type: "enum",
      enum: ["none", "xs", "sm", "md", "lg", "xl"],
      default: "md",
    },
  },
  spacer: {
    size: {
      type: "enum",
      enum: ["none", "xs", "sm", "md", "lg", "xl"],
      default: "md",
    },
  },
};

// =============================================================================
// Composition Patterns
// =============================================================================

interface CompositionPattern {
  name: string;
  description: string;
  category: string;
  example: Record<string, unknown>;
}

const COMPOSITION_PATTERNS: CompositionPattern[] = [
  {
    name: "card-with-header",
    description: "Card with heading, description, and content",
    category: "layout",
    example: {
      type: "card",
      props: { tone: "elevated", padding: "lg" },
      children: [
        {
          type: "stack",
          props: { gap: "sm" },
          children: [
            { type: "kicker", props: { text: "{{category}}" } },
            { type: "heading", props: { text: "{{title}}", level: "4" } },
            { type: "text", props: { text: "{{description}}", tone: "muted" } },
          ],
        },
      ],
    },
  },
  {
    name: "data-list",
    description: "List bound to data source with card items",
    category: "data",
    example: {
      type: "list",
      dataSource: "items",
      props: { gap: "md", emptyText: "No items found" },
      children: [
        {
          type: "card",
          props: { interactive: true },
          propBindings: { key: "$.id" },
          children: [
            {
              type: "heading",
              props: { level: "5" },
              propBindings: { text: "$.name" },
            },
            {
              type: "text",
              props: { tone: "muted", size: "sm" },
              propBindings: { text: "$.description" },
            },
          ],
        },
      ],
    },
  },
  {
    name: "stats-dashboard",
    description: "Grid of stat cards with trends",
    category: "data",
    example: {
      type: "grid",
      props: { columns: 1, mdColumns: 2, lgColumns: 4, gap: "lg" },
      children: [
        {
          type: "card",
          props: { tone: "elevated", padding: "lg" },
          children: [
            {
              type: "stat",
              props: {
                label: "Total Users",
                value: "1,234",
                trend: "up",
                trendLabel: "+12%",
              },
            },
          ],
        },
        {
          type: "card",
          props: { tone: "elevated", padding: "lg" },
          children: [
            {
              type: "stat",
              props: { label: "Active", value: "89%", trend: "neutral" },
            },
          ],
        },
      ],
    },
  },
  {
    name: "simple-form",
    description: "Basic form with text inputs and submit",
    category: "form",
    example: {
      type: "form",
      props: { actionId: "submit-form", submitLabel: "Save" },
      children: [
        {
          type: "formField",
          props: { name: "name", label: "Name", required: true },
          children: [
            {
              type: "textInput",
              props: { name: "name", placeholder: "Enter your name" },
            },
          ],
        },
        {
          type: "formField",
          props: { name: "email", label: "Email", required: true },
          children: [
            {
              type: "textInput",
              props: {
                name: "email",
                placeholder: "email@example.com",
                inputType: "email",
              },
            },
          ],
        },
        {
          type: "formField",
          props: { name: "message", label: "Message" },
          children: [
            {
              type: "textarea",
              props: {
                name: "message",
                placeholder: "Your message...",
                rows: 4,
              },
            },
          ],
        },
      ],
    },
  },
  {
    name: "report-form",
    description: "Allergy report form with severity and symptoms",
    category: "form",
    example: {
      type: "form",
      props: { actionId: "create-report", submitLabel: "Submit Report" },
      children: [
        {
          type: "formField",
          props: {
            name: "productId",
            label: "Product",
            required: true,
            hint: "Select the product that caused the reaction",
          },
          children: [
            {
              type: "textInput",
              props: { name: "productId", placeholder: "Product ID" },
            },
          ],
        },
        {
          type: "formField",
          props: { name: "severity", label: "Severity", required: true },
          children: [
            {
              type: "select",
              props: {
                name: "severity",
                placeholder: "Select severity",
                options: [
                  { value: "LOW", label: "Low - Mild discomfort" },
                  { value: "MEDIUM", label: "Medium - Noticeable reaction" },
                  { value: "HIGH", label: "High - Severe reaction" },
                ],
              },
            },
          ],
        },
        {
          type: "formField",
          props: {
            name: "symptoms",
            label: "Symptoms",
            hint: "Describe what you experienced",
          },
          children: [
            {
              type: "textarea",
              props: {
                name: "symptoms",
                placeholder: "Describe your symptoms...",
                rows: 3,
              },
            },
          ],
        },
        {
          type: "formField",
          props: { name: "comment", label: "Additional Comments" },
          children: [
            {
              type: "textarea",
              props: {
                name: "comment",
                placeholder: "Any other details...",
                rows: 2,
              },
            },
          ],
        },
      ],
    },
  },
  {
    name: "allergen-badges",
    description: "Inline list of allergen badges",
    category: "data",
    example: {
      type: "inline",
      props: { gap: "sm", wrap: true },
      dataSource: "allergens",
      children: [
        {
          type: "badge",
          props: { tone: "accent" },
          propBindings: { text: "$.name" },
        },
      ],
    },
  },
];

// =============================================================================
// MCP Tool Implementations
// =============================================================================

export interface ComponentInfo {
  type: string;
  category: ComponentCategory;
  description: string;
  props: Record<string, PropDoc>;
  allowsChildren: boolean;
  typicalChildren?: string[];
  canBindData: boolean;
  example?: Record<string, unknown>;
}

/**
 * List all components, optionally filtered by category
 */
export function listComponents(category?: ComponentCategory): ComponentInfo[] {
  const types = Object.keys(COMPONENT_PROPS);

  return types
    .filter((type) => !category || COMPONENT_CATEGORIES[type] === category)
    .map((type) => getComponent(type))
    .filter((c): c is ComponentInfo => c !== null);
}

/**
 * Get detailed information about a specific component
 */
export function getComponent(type: string): ComponentInfo | null {
  const props = COMPONENT_PROPS[type];
  if (!props) return null;

  const category = COMPONENT_CATEGORIES[type] ?? "utility";
  const description = COMPONENT_DESCRIPTIONS[type] ?? "";
  // Access COMPONENT_CHILDREN_ALLOWED with proper type checking
  const allowsChildren =
    type in COMPONENT_CHILDREN_ALLOWED
      ? COMPONENT_CHILDREN_ALLOWED[
          type as keyof typeof COMPONENT_CHILDREN_ALLOWED
        ]
      : false;
  const typicalChildren = TYPICAL_CHILDREN[type];

  // Find a pattern example for this component
  const pattern = COMPOSITION_PATTERNS.find((p) => p.example.type === type);

  return {
    type,
    category,
    description,
    props,
    allowsChildren,
    typicalChildren,
    canBindData: [
      "list",
      "card",
      "text",
      "heading",
      "badge",
      "stat",
      "inline",
    ].includes(type),
    example: pattern?.example,
  };
}

/**
 * Get a composition pattern by name
 */
export function getPattern(name: string): CompositionPattern | null {
  return COMPOSITION_PATTERNS.find((p) => p.name === name) ?? null;
}

/**
 * List all composition patterns
 */
export function listPatterns(category?: string): CompositionPattern[] {
  return COMPOSITION_PATTERNS.filter(
    (p) => !category || p.category === category,
  );
}

/**
 * Get the full schema overview for agents
 */
export function getSchemaOverview() {
  return {
    version: "2025-01",
    description: "Server-Driven UI Schema for dynamic UI composition",
    categories: [
      {
        name: "layout",
        description: "Container and layout components",
        components: ["stack", "inline", "grid", "card", "split"],
      },
      {
        name: "typography",
        description: "Text and heading components",
        components: ["heading", "text", "richText", "kicker"],
      },
      {
        name: "data",
        description: "Data display components",
        components: ["list", "stat", "statGroup", "badge"],
      },
      {
        name: "media",
        description: "Image and icon components",
        components: ["image", "icon"],
      },
      {
        name: "interactive",
        description: "Buttons and interactive elements",
        components: ["button", "buttonGroup", "skeleton"],
      },
      {
        name: "form",
        description: "Form inputs and containers",
        components: [
          "form",
          "formField",
          "textInput",
          "textarea",
          "select",
          "checkbox",
          "radio",
          "dateInput",
          "fileUpload",
          "rating",
          "slider",
        ],
      },
      {
        name: "utility",
        description: "Spacing and dividers",
        components: ["divider", "spacer"],
      },
    ],
    dataBinding: {
      description:
        "Components can bind to data sources using dataSource and propBindings",
      example: {
        dataRequirements: [
          {
            id: "products",
            procedure: "product.search",
            input: { query: "oat milk" },
          },
        ],
        component: {
          type: "list",
          dataSource: "products",
          children: [{ type: "card", propBindings: { title: "$.name" } }],
        },
      },
    },
    actions: {
      description:
        "Actions define operations triggered by buttons or form submissions",
      example: {
        actions: [
          {
            id: "submit-report",
            label: "Submit",
            variant: "primary",
            invocation: { type: "trpc", procedure: "report.create" },
          },
        ],
      },
    },
  };
}

// =============================================================================
// MCP Resources
// =============================================================================

export const SDUI_MCP_RESOURCES = {
  "sdui://schema": () => getSchemaOverview(),
  "sdui://components": () => listComponents(),
  "sdui://patterns": () => listPatterns(),
};

export const SDUI_MCP_TOOLS = {
  list_components: listComponents,
  get_component: getComponent,
  get_pattern: getPattern,
  list_patterns: listPatterns,
  get_schema_overview: getSchemaOverview,
};
