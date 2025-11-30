import { NextResponse } from "next/server";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { Experimental_Agent as Agent, stepCountIs, tool } from "ai";
import { z } from "zod";

import type { AgentBlock, AgentRequest } from "~/app/_lib/agent-schema";
import type { SduiAction, SduiScreen, SduiSection } from "~/types/sdui";
import {
  AgentRequestSchema,
  AgentResponseSchema,
} from "~/app/_lib/agent-schema";
import { getModel } from "~/server/ai/openai-client";
import { ensureProductSummary } from "~/server/ai/risk-summary";
import {
  buildAllergenSection,
  buildProductInsightSection,
  buildRecentReportsSection,
  buildReportPromptSection,
  buildSearchResultsSection,
  composeSduiScreen,
  formatRecentReportCards,
} from "~/server/ai/sdui-builder";
import { getServerCaller } from "~/server/trpc-caller";

// Runtime imports for schema builders (values, not types)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sduiSchemaModule = require("@acme/api/sdui-schema") as {
  buildScreen: (input: unknown) => SduiScreen;
  screenSchema: z.ZodType<SduiScreen>;
  sectionSchema: z.ZodType<SduiSection>;
};
const { buildScreen, screenSchema, sectionSchema } = sduiSchemaModule;

// =============================================================================
// MCP Client Factory
// =============================================================================

// MCP client interface for type safety
interface MCPClient {
  tools: () => Promise<Record<string, unknown>>;
  close: () => Promise<void>;
}

interface MCPClients {
  sdui: MCPClient | null;
  trpc: MCPClient | null;
}

async function createMCPClients(): Promise<MCPClients> {
  const clients: MCPClients = { sdui: null, trpc: null };

  // MCP server runs on port 3002 (configurable via MCP_PORT)
  // Using hardcoded default since env validation happens at build time
  const mcpBaseUrl = "http://localhost:3002";

  try {
    // Create SDUI MCP client - connects to Express MCP server
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const sduiClient: MCPClient = await createMCPClient({
      transport: {
        type: "http",
        url: `${mcpBaseUrl}/mcp/sdui`,
      },
      name: "sdui-client",
      onUncaughtError: (error: unknown) => {
        console.error("SDUI MCP client error:", error);
      },
    });
    clients.sdui = sduiClient;
  } catch (error: unknown) {
    console.error("Failed to connect to SDUI MCP server:", error);
  }

  try {
    // Create tRPC MCP client - connects to Express MCP server
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const trpcClient: MCPClient = await createMCPClient({
      transport: {
        type: "http",
        url: `${mcpBaseUrl}/mcp/trpc`,
      },
      name: "trpc-client",
      onUncaughtError: (error: unknown) => {
        console.error("tRPC MCP client error:", error);
      },
    });
    clients.trpc = trpcClient;
  } catch (error: unknown) {
    console.error("Failed to connect to tRPC MCP server:", error);
  }

  return clients;
}

async function closeMCPClients(clients: MCPClients): Promise<void> {
  const closePromises: Promise<void>[] = [];

  if (clients.sdui) {
    closePromises.push(clients.sdui.close().catch(() => undefined));
  }
  if (clients.trpc) {
    closePromises.push(clients.trpc.close().catch(() => undefined));
  }

  await Promise.all(closePromises);
}

// =============================================================================
// System Prompt with Schema Reference
// =============================================================================

// =============================================================================
// Form Input Builder Helper
// =============================================================================

interface FormFieldInput {
  name: string;
  type: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

function buildFormInput(field: FormFieldInput): SduiSection["components"][0] {
  const base = { id: crypto.randomUUID() };

  switch (field.type) {
    case "textarea":
      return {
        ...base,
        type: "textarea",
        props: {
          name: field.name,
          placeholder: field.placeholder,
          rows: 4,
        },
      };

    case "select":
      return {
        ...base,
        type: "select",
        props: {
          name: field.name,
          placeholder: field.placeholder ?? "Select an option",
          options: field.options ?? [],
        },
      };

    case "checkbox":
      return {
        ...base,
        type: "checkbox",
        props: {
          name: field.name,
          label: field.placeholder ?? field.name,
        },
      };

    case "radio":
      return {
        ...base,
        type: "radio",
        props: {
          name: field.name,
          options: field.options ?? [],
        },
      };

    case "date":
      return {
        ...base,
        type: "dateInput",
        props: {
          name: field.name,
          placeholder: field.placeholder,
        },
      };

    case "number":
      return {
        ...base,
        type: "textInput",
        props: {
          name: field.name,
          placeholder: field.placeholder,
          inputType: "number",
        },
      };

    case "email":
      return {
        ...base,
        type: "textInput",
        props: {
          name: field.name,
          placeholder: field.placeholder,
          inputType: "email",
        },
      };

    default:
      // text and others
      return {
        ...base,
        type: "textInput",
        props: {
          name: field.name,
          placeholder: field.placeholder,
          inputType: "text",
        },
      };
  }
}

// =============================================================================
// System Prompt with Schema Reference
// =============================================================================

const SDUI_SCHEMA_REFERENCE = `
## SDUI Builder Tools (Recommended)

For building UI, use these simplified builder tools instead of raw compose_screen:

### compose_form
Build a complete form with fields. Example:
{
  "actionId": "create-report",
  "title": "Report Reaction",
  "fields": [
    { "name": "severity", "label": "Severity", "type": "select", "required": true,
      "options": [{ "value": "LOW", "label": "Low" }, { "value": "HIGH", "label": "High" }] },
    { "name": "symptoms", "label": "Symptoms", "type": "textarea" },
    { "name": "comment", "label": "Comments", "type": "text" }
  ]
}

### compose_section
Build a section with components. Example:
{
  "title": "Product Card",
  "tone": "default",
  "components": [
    { "type": "heading", "props": { "text": "Rice Crackers", "level": "4" } },
    { "type": "text", "props": { "text": "Crunchy gluten-free snacks", "tone": "muted" } },
    { "type": "badge", "props": { "text": "Gluten Free", "tone": "success" } }
  ]
}

### compose_card
Build a single card. Example:
{
  "title": "Product Name",
  "subtitle": "Brand name",
  "body": "Description text",
  "tone": "elevated",
  "badges": [{ "text": "Safe", "tone": "success" }]
}

### compose_stats
Build a stats section. Example:
{
  "title": "Dashboard",
  "stats": [
    { "label": "Total Reports", "value": "42", "trend": "up", "trendLabel": "+12%" },
    { "label": "Risk Level", "value": "Low", "trend": "neutral" }
  ]
}

## Discovery Tools

Use these to learn about available components and data:
- list_components: See all components by category
- get_component: Get detailed props for a component
- get_pattern: Get composition patterns (report-form, data-list, etc.)
- list_routers: See tRPC routers
- get_form_fields: Get recommended form fields for a procedure
`;

// =============================================================================
// Route Handler
// =============================================================================

export async function POST(request: Request) {
  const json = (await request
    .json()
    .catch(() => null)) as unknown as AgentRequest;
  const parsed = AgentRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const response = await runAgent(parsed.data, request);
    return NextResponse.json(response);
  } catch (error) {
    console.error("agent error", error);
    const fallback = AgentResponseSchema.parse({
      blocks: [
        {
          id: crypto.randomUUID(),
          kind: "text",
          role: "assistant",
          text: "I encountered an issue. Let me search for what you mentioned instead.",
        },
        {
          id: crypto.randomUUID(),
          kind: "component",
          component: "lookupResults",
          props: { query: parsed.data.prompt },
        },
      ],
      meta: { source: "stub" },
    });
    return NextResponse.json(fallback, { status: 200 });
  }
}

// =============================================================================
// Agent Runner
// =============================================================================

async function runAgent(payload: AgentRequest, request: Request) {
  const caller = await getServerCaller(request.headers);
  const session = await caller.auth.getSession();
  const userName = session?.user.name ?? "friend";

  // Collect UI blocks from tool calls
  const uiBlocks: AgentBlock[] = [];
  const sduiSections: SduiSection[] = [];
  const viewActions: SduiAction[] = [];
  // Using a mutable object to allow assignment inside tool callbacks
  // that TypeScript's control flow analysis can't track
  const screenRef: { current: SduiScreen | null } = { current: null };

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  // Build conversation context from history - increased to 20 blocks
  const conversationHistory = (payload.blocks ?? [])
    .slice(-20)
    .map((block) =>
      block.kind === "text"
        ? `${block.role}: ${block.text}`
        : `[showed ${block.component} component]`,
    )
    .join("\n");

  // Create MCP clients (connects to Express MCP server on port 3001)
  const mcpClients = await createMCPClients();

  try {
    // Get discovery tools from MCP clients (not builder tools - we wrap those)
    const sduiDiscoveryTools = mcpClients.sdui
      ? await mcpClients.sdui.tools()
      : {};
    const trpcDiscoveryTools = mcpClients.trpc
      ? await mcpClients.trpc.tools()
      : {};

    // Create the agent with tools
    const allergyAgent = new Agent({
      model: getModel(),
      system: `You are the Traces Known allergy assistant, helping users find safe food products and manage their allergies.

The user's name is ${userName}.

## Available Tools

### High-Level Tools (use for common tasks)
- searchProducts: Search for food products by name, brand, or barcode
- getProductDetails: Get detailed allergen and risk information for a product
- getUserAllergens: Get the user's allergen preferences
- showRecentReports: Show recent allergy reports

### SDUI Builder Tools (for constructing UI dynamically)
- buildForm: Build a complete form with fields - adds to screen automatically
- buildSection: Build a custom section with components - adds to screen automatically
- buildCard: Build a card component - adds to screen automatically
- buildStats: Build a stats dashboard - adds to screen automatically

### Discovery Tools (use these to understand what's available)
- list_components: See all SDUI components by category
- get_component: Get detailed props for a component
- get_pattern: Get composition patterns
- list_routers: See available tRPC routers
- list_procedures: List procedures in a router
- get_procedure: Get input/output schema for a procedure
- get_form_fields: Get recommended form fields for a procedure (use this to build forms!)

## Critical Rules
- NEVER include markdown formatting (###, **, -, etc.) in text responses
- NEVER describe what you would build - ALWAYS call the builder tools instead
- Text responses should be minimal (1-2 sentences max) - the UI components speak for themselves
- If you're building UI, your text response should be brief acknowledgment only (e.g., "Here are the products" or "I've created the form")
- Be proactive: if the user's intent is reasonably clear, take action rather than asking for clarification

## Workflow for Building ANY UI

When the user requests ANY UI (forms, dashboards, lists, cards, etc.):

1. Discover what's available:
   - Use list_routers or list_procedures to find relevant tRPC procedures
   - Use get_procedure to understand data schemas
   - Use get_form_fields if building a form
   - Use list_components or get_component to understand SDUI components
   - Use get_pattern to see reusable composition patterns

2. Build the UI dynamically by CALLING TOOLS:
   - Use buildForm for forms (with fields from get_form_fields)
   - Use buildSection for custom sections with components
   - Use buildCard for card-based layouts
   - Use buildStats for dashboards with statistics
   - Use compose_screen or add_section for complex custom layouts
   
   IMPORTANT: Each item in a list should be built as a separate component (card, section, etc.), not described in text.

3. Connect to data:
   - Forms automatically connect to tRPC procedures via actionId
   - Use data bindings in components to display data from procedures
   - Actions invoke tRPC procedures to fetch or mutate data

## Examples
- "Show me my reports" → Call list_procedures → Find report.mine → Call buildSection with list components
- "I want to report a reaction" → Call get_form_fields with procedure "report.create" → Call buildForm with those fields
- "Show product details" → Call getProductDetails → Call buildCard or buildSection with the data
- "Show allergen risk products" → For EACH product, call buildCard with product data - DO NOT list them in text

${SDUI_SCHEMA_REFERENCE}

${conversationHistory ? `## Recent Conversation\n${conversationHistory}` : ""}`,

      tools: {
        // MCP Discovery Tools (for learning about components/procedures)
        ...sduiDiscoveryTools,
        ...trpcDiscoveryTools,

        // =======================================================================
        // SDUI Builder Tools (wrapper around MCP that adds sections directly)
        // =======================================================================

        buildForm: tool({
          description:
            "Build a complete form section with fields. The form will be added to the canvas immediately.",
          inputSchema: z.object({
            actionId: z
              .string()
              .describe(
                "ID of the action to invoke on submit (e.g., 'create-report')",
              ),
            title: z.string().optional().describe("Form section title"),
            description: z
              .string()
              .optional()
              .describe("Form section description"),
            submitLabel: z.string().optional().describe("Submit button text"),
            fields: z
              .array(
                z.object({
                  name: z.string().describe("Field name"),
                  label: z.string().describe("Field label"),
                  type: z
                    .enum([
                      "text",
                      "email",
                      "textarea",
                      "select",
                      "checkbox",
                      "radio",
                      "date",
                      "number",
                    ])
                    .describe("Input type"),
                  required: z
                    .boolean()
                    .optional()
                    .describe("Is field required"),
                  placeholder: z
                    .string()
                    .optional()
                    .describe("Placeholder text"),
                  hint: z.string().optional().describe("Help text"),
                  options: z
                    .array(z.object({ value: z.string(), label: z.string() }))
                    .optional()
                    .describe("Options for select/radio"),
                }),
              )
              .min(1)
              .describe("Form fields"),
          }),
          execute: ({ actionId, title, description, submitLabel, fields }) => {
            // Build form components directly
            const formChildren: SduiSection["components"][0][] = fields.map(
              (field) => ({
                id: crypto.randomUUID(),
                type: "formField" as const,
                props: {
                  name: field.name,
                  label: field.label,
                  required: field.required ?? false,
                  hint: field.hint,
                },
                children: [buildFormInput(field)],
              }),
            );

            const section: SduiSection = {
              id: crypto.randomUUID(),
              tone: "default",
              background: "surface",
              padding: "lg",
              gap: "md",
              width: "default",
              border: "soft",
              header: title
                ? { title, description, align: "start" }
                : undefined,
              components: [
                {
                  id: crypto.randomUUID(),
                  type: "form",
                  props: {
                    actionId,
                    submitLabel: submitLabel ?? "Submit",
                  },
                  children: formChildren,
                },
              ],
            };

            sduiSections.push(section);

            return {
              success: true,
              message: `Created form "${title ?? actionId}" with ${fields.length} fields`,
            };
          },
        }),

        buildSection: tool({
          description:
            "Build a custom section with components. The section will be added to the canvas immediately.",
          inputSchema: z.object({
            kicker: z.string().optional().describe("Small label above title"),
            title: z.string().optional().describe("Section title"),
            description: z.string().optional().describe("Section description"),
            tone: z
              .enum(["default", "muted", "contrast", "accent"])
              .optional()
              .describe("Visual tone"),
            components: z
              .array(
                z.object({
                  type: z
                    .enum([
                      "heading",
                      "text",
                      "badge",
                      "stat",
                      "card",
                      "button",
                      "divider",
                    ])
                    .describe("Component type"),
                  props: z.record(z.unknown()).describe("Component props"),
                }),
              )
              .min(1)
              .describe("Components to include"),
          }),
          execute: ({ kicker, title, description, tone, components }) => {
            const section: SduiSection = {
              id: crypto.randomUUID(),
              tone: tone ?? "default",
              background: "surface",
              padding: "lg",
              gap: "md",
              width: "default",
              border: "soft",
              header:
                (kicker ?? title ?? description)
                  ? { kicker, title, description, align: "start" }
                  : undefined,
              components: components.map((c) => ({
                id: crypto.randomUUID(),
                type: c.type,
                props: c.props,
              })),
            };

            sduiSections.push(section);

            return {
              success: true,
              message: `Created section "${title ?? "untitled"}" with ${components.length} components`,
            };
          },
        }),

        buildCard: tool({
          description:
            "Build a card component. The card will be added to the canvas as a section.",
          inputSchema: z.object({
            title: z.string().optional().describe("Card title"),
            subtitle: z.string().optional().describe("Subtitle text"),
            body: z.string().optional().describe("Body text"),
            tone: z
              .enum(["plain", "muted", "accent", "elevated", "subtle"])
              .optional()
              .describe("Card style"),
            badges: z
              .array(
                z.object({
                  text: z.string(),
                  tone: z
                    .enum([
                      "default",
                      "muted",
                      "accent",
                      "success",
                      "warning",
                      "danger",
                    ])
                    .optional(),
                }),
              )
              .optional()
              .describe("Badges to show"),
          }),
          execute: ({ title, subtitle, body, tone, badges }) => {
            const cardChildren: SduiSection["components"] = [];

            if (title) {
              cardChildren.push({
                id: crypto.randomUUID(),
                type: "heading",
                props: { text: title, level: "4", tone: "default" },
              });
            }

            if (subtitle) {
              cardChildren.push({
                id: crypto.randomUUID(),
                type: "text",
                props: { text: subtitle, size: "sm", tone: "muted" },
              });
            }

            if (body) {
              cardChildren.push({
                id: crypto.randomUUID(),
                type: "text",
                props: { text: body, size: "md", tone: "default" },
              });
            }

            if (badges && badges.length > 0) {
              cardChildren.push({
                id: crypto.randomUUID(),
                type: "inline",
                props: { gap: "sm", wrap: true },
                children: badges.map((b) => ({
                  id: crypto.randomUUID(),
                  type: "badge",
                  props: { text: b.text, tone: b.tone ?? "default" },
                })),
              });
            }

            const section: SduiSection = {
              id: crypto.randomUUID(),
              tone: "default",
              background: "surface",
              padding: "lg",
              gap: "md",
              width: "default",
              border: "soft",
              components: [
                {
                  id: crypto.randomUUID(),
                  type: "card",
                  props: { tone: tone ?? "elevated", padding: "md" },
                  children:
                    cardChildren.length > 0
                      ? [
                          {
                            id: crypto.randomUUID(),
                            type: "stack",
                            props: { gap: "sm" },
                            children: cardChildren,
                          },
                        ]
                      : undefined,
                },
              ],
            };

            sduiSections.push(section);

            return {
              success: true,
              message: `Created card "${title ?? "untitled"}"`,
            };
          },
        }),

        buildStats: tool({
          description: "Build a stats dashboard section.",
          inputSchema: z.object({
            title: z.string().optional().describe("Section title"),
            stats: z
              .array(
                z.object({
                  label: z.string().describe("Stat label"),
                  value: z.string().describe("Stat value"),
                  trend: z
                    .enum(["up", "down", "neutral"])
                    .optional()
                    .describe("Trend"),
                  trendLabel: z
                    .string()
                    .optional()
                    .describe("Trend description"),
                }),
              )
              .min(1)
              .describe("Stats to display"),
            columns: z.number().optional().describe("Number of columns"),
          }),
          execute: ({ title, stats, columns }) => {
            const statCards: SduiSection["components"] = stats.map((stat) => ({
              id: crypto.randomUUID(),
              type: "card",
              props: { tone: "elevated", padding: "lg" },
              children: [
                {
                  id: crypto.randomUUID(),
                  type: "stat",
                  props: {
                    label: stat.label,
                    value: stat.value,
                    trend: stat.trend,
                    trendLabel: stat.trendLabel,
                    size: "md",
                  },
                },
              ],
            }));

            const section: SduiSection = {
              id: crypto.randomUUID(),
              tone: "default",
              background: "surface",
              padding: "lg",
              gap: "md",
              width: "default",
              border: "soft",
              header: title ? { title, align: "start" } : undefined,
              components: [
                {
                  id: crypto.randomUUID(),
                  type: "grid",
                  props: {
                    columns: 1,
                    mdColumns: Math.min(columns ?? 2, 4),
                    gap: "md",
                  },
                  children: statCards,
                },
              ],
            };

            sduiSections.push(section);

            return {
              success: true,
              message: `Created stats section with ${stats.length} stats`,
            };
          },
        }),

        // =======================================================================
        // High-Level Tools
        // =======================================================================

        searchProducts: tool({
          description:
            "Search for food products by name, brand, or barcode. Use this when the user mentions a specific product or wants to find something.",
          inputSchema: z.object({
            query: z
              .string()
              .describe("Product name, brand, or barcode to search"),
          }),
          execute: async ({ query }) => {
            const results = await caller.product.search({
              query,
              page: 1,
              limit: 6,
            });

            uiBlocks.push({
              id: crypto.randomUUID(),
              kind: "component",
              component: "lookupResults",
              props: { query },
            });

            sduiSections.push(
              buildSearchResultsSection({
                query,
                results: results.map((product) => ({
                  id: product.id,
                  name: product.name,
                  barcode: product.barcode ?? undefined,
                })),
              }),
            );

            return {
              found: results.length,
              products: results.map((p) => ({
                id: p.id,
                name: p.name,
                barcode: p.barcode,
              })),
            };
          },
        }),

        getProductDetails: tool({
          description:
            "Get detailed allergen and risk information for a specific product by ID. Use after searching to show details.",
          inputSchema: z.object({
            productId: z
              .string()
              .uuid()
              .describe("The product ID to get details for"),
          }),
          execute: async ({ productId }) => {
            const detail = await caller.product.detail({ id: productId });

            if (!detail) {
              return { error: "Product not found" };
            }

            await ensureProductSummary(productId).catch(() => null);

            uiBlocks.push({
              id: crypto.randomUUID(),
              kind: "component",
              component: "productSummary",
              props: { productId },
            });

            const lastReported =
              detail.stats.lastReportedAt !== null
                ? dateFormatter.format(detail.stats.lastReportedAt)
                : null;

            sduiSections.push(
              buildProductInsightSection({
                product: {
                  name: detail.product.name,
                  brand: detail.product.brand,
                  allergenWarning: detail.product.allergenWarning,
                  riskLevel: detail.product.riskLevel,
                  totalReports: detail.stats.totalReports,
                  lastReportedAt: lastReported,
                },
              }),
            );

            sduiSections.push(
              buildReportPromptSection({ productName: detail.product.name }),
            );

            return {
              name: detail.product.name,
              brand: detail.product.brand,
              allergenWarning: detail.product.allergenWarning,
              riskLevel: detail.product.riskLevel,
              totalReports: detail.stats.totalReports,
            };
          },
        }),

        getUserAllergens: tool({
          description:
            "Get the current user's allergen preferences and sensitivities. Use when discussing their allergies or preferences.",
          inputSchema: z.object({}),
          execute: async () => {
            if (!session?.user.id) {
              return { error: "User not logged in", allergens: [] };
            }

            const allergens = await caller.allergen.mine();

            uiBlocks.push({
              id: crypto.randomUUID(),
              kind: "component",
              component: "allergenPreferences",
              props: {},
            });

            sduiSections.push(
              buildAllergenSection({
                allergens: allergens.map((a) => a.name),
              }),
            );

            return {
              allergens: allergens.map((a) => a.name),
            };
          },
        }),

        showRecentReports: tool({
          description:
            "Show recent allergy reports. Use 'mine' scope for user's own reports, 'latest' for community reports.",
          inputSchema: z.object({
            scope: z
              .enum(["latest", "mine"])
              .describe("'mine' for user's reports, 'latest' for all recent"),
          }),
          execute: async ({ scope }) => {
            if (scope === "mine" && !session?.user.id) {
              return { error: "User not logged in", shown: false, scope };
            }

            const reports =
              scope === "mine"
                ? await caller.report.mine({ limit: 5 })
                : await caller.report.latest({ limit: 5 });

            uiBlocks.push({
              id: crypto.randomUUID(),
              kind: "component",
              component: "recentReports",
              props: { scope },
            });

            const cards = formatRecentReportCards(reports, dateFormatter);

            sduiSections.push(
              buildRecentReportsSection({
                scope,
                reports: cards,
                registerAction: (action) => viewActions.push(action),
              }),
            );

            return { shown: true, scope, count: reports.length };
          },
        }),

        // =======================================================================
        // Low-Level Tool: Raw SDUI Composition
        // =======================================================================

        compose_screen: tool({
          description: `Compose a custom SDUI screen with full control over layout, sections, and components. Use this for complex dashboards or custom layouts that the high-level tools don't support.

The screen must conform to the SDUI v2025-01 schema. Include:
- id: unique identifier
- version: "2025-01"
- layout: "canvas" (default)
- sections: array of section objects with components
- actions: optional action definitions
- dataRequirements: optional data fetching declarations`,
          inputSchema: screenSchema,
          execute: (screen) => {
            // Validate the screen
            const validatedScreen = buildScreen(screen);
            screenRef.current = validatedScreen;

            return {
              success: true,
              screenId: validatedScreen.id,
              sectionCount: validatedScreen.sections.length,
            };
          },
        }),

        // =======================================================================
        // Section Composition Tool (for adding sections to existing screens)
        // =======================================================================

        add_section: tool({
          description:
            "Add a custom section to the current screen. Use this to incrementally build up a screen with multiple sections.",
          inputSchema: sectionSchema,
          execute: (section) => {
            sduiSections.push(section);
            return {
              success: true,
              sectionId: section.id,
              componentCount: section.components.length,
            };
          },
        }),
      },

      stopWhen: stepCountIs(10),
    });

    // Run the agent
    const result = await allergyAgent.generate({
      prompt: payload.prompt,
    });

    // Add the assistant's text response as a block (only if there's meaningful text)
    // Suppress text if it contains markdown or is just describing what was built
    if (result.text) {
      const text = result.text.trim();
      // Skip text that looks like markdown descriptions or is just describing UI
      const hasMarkdown = /^#{1,6}\s|^\*\*|^-\s|^\[.*\]\(|`/.test(text);
      const isDescription =
        text.toLowerCase().includes("i've created") ||
        text.toLowerCase().includes("i've built") ||
        text.toLowerCase().includes("here's what");

      // Only add text if it's meaningful and not just a description
      if (!hasMarkdown && (!isDescription || sduiSections.length === 0)) {
        uiBlocks.unshift({
          id: crypto.randomUUID(),
          kind: "text",
          role: "assistant",
          text: text,
        });
      }
    }

    // If no blocks were created, add a default response
    if (uiBlocks.length === 0 && sduiSections.length === 0) {
      uiBlocks.push({
        id: crypto.randomUUID(),
        kind: "text",
        role: "assistant",
        text: "I'm here to help you find allergy-safe foods. Try asking about a specific product or say 'show my allergens' to see your preferences.",
      });
    }

    // Use custom screen if agent composed one, otherwise build from sections
    const baseScreen =
      screenRef.current ??
      composeSduiScreen({
        userName,
        prompt: payload.prompt,
        assistantText: result.text,
        sections: sduiSections,
        actions: viewActions,
      });

    // Ensure the screen always has the overlay for the chat input
    const existingLayoutProps = (baseScreen.layoutProps ?? {}) as Record<
      string,
      unknown
    >;
    const sduiScreen: SduiScreen = {
      ...baseScreen,
      layoutProps: {
        tone: "neutral",
        padding: "lg",
        width: "wide",
        fullscreen: true,
        scrollable: true,
        overlayPlacement: "bottom-center",
        overlayWidth: "medium",
        ...existingLayoutProps,
        overlay: {
          type: "chat-input" as const,
          placeholder: "Ask the agent to reshape the canvas…",
          helperText: "Shift + Enter to add a newline",
          quickActions: [
            {
              id: "qa-search",
              label: "Find safe snacks",
              prompt: "Search for gluten-free snacks",
            },
            {
              id: "qa-allergens",
              label: "My allergens",
              prompt: "Show my allergen preferences",
            },
          ],
        },
      },
    };

    return AgentResponseSchema.parse({
      blocks: uiBlocks,
      meta: { source: "openai" },
      view: sduiScreen,
    });
  } finally {
    // Always close MCP clients
    await closeMCPClients(mcpClients);
  }
}
