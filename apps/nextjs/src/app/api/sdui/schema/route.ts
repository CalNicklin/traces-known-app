import { NextResponse } from "next/server";

import type { ComponentType } from "~/types/sdui";

// Runtime imports for schema constants
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { COMPONENT_CHILDREN_ALLOWED, COMPONENT_TYPES } = require("@acme/api/sdui-schema") as {
  COMPONENT_CHILDREN_ALLOWED: Record<ComponentType, boolean>;
  COMPONENT_TYPES: ComponentType[];
};

/**
 * GET /api/sdui/schema
 *
 * Returns schema documentation for MCP/agent access.
 * This endpoint provides the full schema reference that agents can query
 * to understand available component types, props, and constraints.
 */
export async function GET() {
  return NextResponse.json({
    version: "2025-01",
    description: "SDUI Schema v2025-01 - Airbnb-inspired Server-Driven UI",

    // Screen structure
    screen: {
      description: "Top-level envelope containing layout, sections, actions, and data requirements",
      fields: {
        id: { type: "string", required: true, description: "Unique identifier" },
        version: { type: "literal", value: "2025-01", required: true },
        title: { type: "string", description: "Screen title for accessibility" },
        description: { type: "string", description: "Screen description" },
        layout: {
          type: "enum",
          values: ["canvas", "modal", "drawer"],
          default: "canvas",
        },
        layoutProps: { type: "object", description: "Layout-specific configuration" },
        sections: { type: "array", itemType: "Section", required: true, minItems: 1 },
        actions: { type: "array", itemType: "Action", default: [] },
        dataRequirements: { type: "array", itemType: "DataRequirement", default: [] },
        metadata: { type: "object", description: "Arbitrary metadata" },
      },
    },

    // Section structure
    section: {
      description: "Semantic grouping of components with optional header",
      fields: {
        id: { type: "string", required: true },
        tone: { type: "enum", values: ["default", "muted", "contrast", "accent"], default: "default" },
        background: { type: "enum", values: ["transparent", "surface", "panel", "glass"], default: "surface" },
        padding: { type: "enum", values: ["none", "xs", "sm", "md", "lg", "xl"], default: "lg" },
        gap: { type: "enum", values: ["none", "xs", "sm", "md", "lg", "xl"], default: "md" },
        width: { type: "enum", values: ["narrow", "content", "default", "wide", "full"], default: "default" },
        border: { type: "enum", values: ["none", "soft", "strong"], default: "soft" },
        header: {
          type: "object",
          fields: {
            kicker: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            align: { type: "enum", values: ["start", "center", "end"], default: "start" },
          },
        },
        components: { type: "array", itemType: "Component", required: true, minItems: 1 },
        actions: { type: "array", itemType: "string", description: "Action IDs to display" },
        dataSource: { type: "string", description: "DataRequirement ID for section-level data" },
      },
    },

    // Component structure
    component: {
      description: "UI primitive with props, optional data binding, and children",
      fields: {
        id: { type: "string", required: true },
        type: { type: "enum", values: COMPONENT_TYPES, required: true },
        props: { type: "object", default: {}, description: "Type-specific props" },
        dataSource: { type: "string", description: "DataRequirement ID" },
        propBindings: { type: "object", description: "JSONPath bindings: { propName: '$.path.to.data' }" },
        children: { type: "array", itemType: "Component" },
        actions: { type: "array", itemType: "string" },
        visibility: { type: "enum", values: ["visible", "hidden", "collapsed"], default: "visible" },
      },
    },

    // Component types with allowed children
    componentTypes: COMPONENT_TYPES.map((type) => ({
      type,
      allowsChildren: COMPONENT_CHILDREN_ALLOWED[type],
      category: getComponentCategory(type),
    })),

    // Component props reference
    componentProps: {
      // Layout
      stack: {
        gap: { type: "enum", values: ["none", "xs", "sm", "md", "lg", "xl"], default: "md" },
        padding: { type: "enum", values: ["none", "xs", "sm", "md", "lg", "xl"], default: "none" },
        align: { type: "enum", values: ["start", "center", "end", "stretch"], default: "stretch" },
        justify: { type: "enum", values: ["start", "center", "end", "between"], default: "start" },
        fullHeight: { type: "boolean", default: false },
      },
      inline: {
        gap: { type: "enum", values: ["none", "xs", "sm", "md", "lg", "xl"], default: "sm" },
        align: { type: "enum", values: ["start", "center", "end", "stretch"], default: "center" },
        justify: { type: "enum", values: ["start", "center", "end", "between"], default: "start" },
        wrap: { type: "boolean", default: false },
      },
      grid: {
        columns: { type: "number", min: 1, max: 12, default: 1 },
        smColumns: { type: "number", min: 1, max: 12 },
        mdColumns: { type: "number", min: 1, max: 12 },
        lgColumns: { type: "number", min: 1, max: 12 },
        gap: { type: "enum", values: ["none", "xs", "sm", "md", "lg", "xl"], default: "md" },
        equalHeight: { type: "boolean", default: false },
      },
      card: {
        tone: { type: "enum", values: ["plain", "muted", "accent", "elevated", "subtle"], default: "plain" },
        padding: { type: "enum", values: ["none", "xs", "sm", "md", "lg", "xl"], default: "md" },
        interactive: { type: "boolean", default: false },
        bordered: { type: "boolean", default: true },
      },
      split: {
        ratio: { type: "enum", values: ["1:1", "2:1", "1:2", "3:2", "2:3", "3:1", "1:3"], default: "1:1" },
        stackBelow: { type: "enum", values: ["sm", "md", "lg", "xl", "never"], default: "md" },
        gap: { type: "enum", values: ["none", "xs", "sm", "md", "lg", "xl"], default: "md" },
        align: { type: "enum", values: ["start", "center", "end", "stretch"], default: "stretch" },
      },

      // Typography
      heading: {
        text: { type: "string", required: true },
        level: { type: "enum", values: ["display", "1", "2", "3", "4", "5", "6"], default: "3" },
        tone: { type: "enum", values: ["default", "muted", "accent"], default: "default" },
        align: { type: "enum", values: ["start", "center", "end"], default: "start" },
        weight: { type: "enum", values: ["light", "normal", "medium", "semibold", "bold"] },
      },
      text: {
        text: { type: "string", required: true },
        size: { type: "enum", values: ["xs", "sm", "md", "lg", "xl"], default: "md" },
        tone: { type: "enum", values: ["default", "muted", "accent", "success", "warning", "danger"], default: "default" },
        emphasis: { type: "enum", values: ["none", "medium", "strong"], default: "none" },
        align: { type: "enum", values: ["start", "center", "end", "justify"], default: "start" },
        clampLines: { type: "number", min: 1, max: 10 },
      },
      kicker: {
        text: { type: "string", required: true },
        tone: { type: "enum", values: ["default", "muted", "accent"], default: "muted" },
      },

      // Data
      list: {
        emptyText: { type: "string", default: "No items" },
        orientation: { type: "enum", values: ["vertical", "horizontal"], default: "vertical" },
        gap: { type: "enum", values: ["none", "xs", "sm", "md", "lg", "xl"], default: "md" },
      },
      stat: {
        label: { type: "string", required: true },
        value: { type: "string", required: true },
        previousValue: { type: "string" },
        trend: { type: "enum", values: ["up", "down", "neutral"] },
        trendLabel: { type: "string" },
        size: { type: "enum", values: ["sm", "md", "lg"], default: "md" },
      },
      badge: {
        text: { type: "string", required: true },
        tone: { type: "enum", values: ["default", "muted", "accent", "success", "warning", "danger"], default: "default" },
        size: { type: "enum", values: ["sm", "md"], default: "sm" },
      },

      // Interactive
      button: {
        label: { type: "string", required: true },
        actionId: { type: "string", description: "Action to invoke on click" },
        variant: { type: "enum", values: ["primary", "secondary", "ghost", "link", "destructive"], default: "secondary" },
        size: { type: "enum", values: ["sm", "md", "lg"], default: "md" },
        icon: { type: "string" },
        iconPosition: { type: "enum", values: ["start", "end"], default: "start" },
        fullWidth: { type: "boolean", default: false },
      },
      skeleton: {
        variant: { type: "enum", values: ["text", "heading", "card", "image", "stat"], default: "text" },
        lines: { type: "number", min: 1, max: 10, default: 1 },
      },

      // Utility
      divider: {
        variant: { type: "enum", values: ["solid", "dashed", "glow"], default: "solid" },
        spacing: { type: "enum", values: ["none", "xs", "sm", "md", "lg", "xl"], default: "md" },
      },
      spacer: {
        size: { type: "enum", values: ["none", "xs", "sm", "md", "lg", "xl"], default: "md" },
      },
      image: {
        src: { type: "string", required: true },
        alt: { type: "string", required: true },
        aspect: { type: "enum", values: ["auto", "square", "video", "wide"], default: "auto" },
        fit: { type: "enum", values: ["cover", "contain", "fill"], default: "cover" },
        rounded: { type: "boolean", default: false },
      },
    },

    // Data requirements
    dataRequirement: {
      description: "Declares a tRPC procedure the client should fetch",
      fields: {
        id: { type: "string", required: true, description: "Unique ID to reference in dataSource" },
        procedure: { type: "string", required: true, description: "tRPC procedure path (e.g., 'product.search')" },
        input: { type: "object", description: "Input parameters for the procedure" },
        staleTime: { type: "number", default: 30000, description: "Cache TTL in milliseconds" },
        refetchOnWindowFocus: { type: "boolean", default: false },
      },
    },

    // Actions
    action: {
      description: "User-triggerable action defined at screen level",
      fields: {
        id: { type: "string", required: true },
        label: { type: "string", required: true },
        variant: { type: "enum", values: ["primary", "secondary", "ghost", "link", "destructive"], default: "secondary" },
        icon: { type: "string" },
        hotkey: { type: "string" },
        disabled: { type: "boolean", default: false },
        invocation: {
          type: "discriminatedUnion",
          discriminator: "type",
          variants: {
            trpc: { procedure: "string", input: "object" },
            url: { url: "string", method: "enum", headers: "object", body: "object" },
            navigate: { path: "string", params: "object" },
            prompt: { text: "string" },
          },
        },
      },
    },

    // Data binding examples
    dataBindingExamples: [
      {
        title: "Simple list with data binding",
        json: {
          dataRequirements: [
            { id: "products", procedure: "product.search", input: { query: "oat milk" } },
          ],
          sections: [{
            id: "results",
            components: [{
              id: "product-list",
              type: "list",
              dataSource: "products",
              propBindings: { items: "$.data" },
              props: { emptyText: "No products found" },
              children: [{
                id: "product-card",
                type: "card",
                props: { interactive: true },
                propBindings: { title: "$.name" },
              }],
            }],
          }],
        },
      },
      {
        title: "Stats dashboard",
        json: {
          sections: [{
            id: "stats",
            header: { kicker: "Overview", title: "Dashboard" },
            components: [{
              id: "stat-group",
              type: "inline",
              props: { gap: "lg" },
              children: [
                { id: "stat-1", type: "stat", props: { label: "Products", value: "1,234", trend: "up" } },
                { id: "stat-2", type: "stat", props: { label: "Reports", value: "567", trend: "neutral" } },
              ],
            }],
          }],
        },
      },
    ],
  });
}

function getComponentCategory(type: string): string {
  const categories: Record<string, string[]> = {
    layout: ["stack", "inline", "grid", "card", "split"],
    typography: ["heading", "text", "richText", "kicker"],
    data: ["list", "stat", "statGroup", "badge"],
    media: ["image", "icon"],
    interactive: ["button", "buttonGroup", "skeleton"],
    utility: ["divider", "spacer"],
  };

  for (const [category, types] of Object.entries(categories)) {
    if (types.includes(type)) return category;
  }

  return "unknown";
}

