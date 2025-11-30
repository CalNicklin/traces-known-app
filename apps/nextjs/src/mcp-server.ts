/**
 * MCP Express Server
 *
 * Runs alongside Next.js to expose SDUI and tRPC discovery tools via MCP.
 * The agent connects to this server to learn about available components
 * and construct UI dynamically.
 *
 * @fileoverview Standalone server script - uses different patterns than Next.js
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, turbo/no-undeclared-env-vars, @typescript-eslint/no-floating-promises */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import express from "express";
import { z } from "zod";

// Import the existing MCP functions from @acme/api
import {
  getComponent,
  getPattern,
  getSchemaOverview,
  listComponents,
  listPatterns,
} from "@acme/api/mcp/sdui-server";
import {
  getFormFieldsForProcedure,
  getProcedure,
  listProcedures,
  listRouters,
} from "@acme/api/mcp/trpc-server";

// =============================================================================
// SDUI MCP Server
// =============================================================================

function createSduiServer(): McpServer {
  const server = new McpServer({
    name: "sdui-mcp-server",
    version: "1.0.0",
  });

  // ---------------------------------------------------------------------------
  // Component Discovery Tools
  // ---------------------------------------------------------------------------

  server.registerTool(
    "list_components",
    {
      title: "List SDUI Components",
      description: `List all available SDUI components for building UI.
      
Categories:
- layout: stack, inline, grid, card, split
- typography: heading, text, richText, kicker  
- data: list, stat, statGroup, badge
- media: image, icon
- interactive: button, buttonGroup, skeleton
- form: form, formField, textInput, textarea, select, checkbox, radio, dateInput, fileUpload, rating, slider
- utility: divider, spacer`,
      inputSchema: {
        category: z
          .enum([
            "layout",
            "typography",
            "data",
            "media",
            "interactive",
            "form",
            "utility",
          ])
          .optional()
          .describe("Filter by category"),
      },
    },
    ({ category }) => {
      const components = listComponents(category);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                count: components.length,
                components: components.map((c) => ({
                  type: c.type,
                  category: c.category,
                  description: c.description,
                  allowsChildren: c.allowsChildren,
                  typicalChildren: c.typicalChildren,
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_component",
    {
      title: "Get Component Details",
      description:
        "Get detailed props, allowed children, and usage examples for a specific component. Use this to understand how to use a component.",
      inputSchema: {
        type: z
          .string()
          .describe(
            "Component type (e.g., 'form', 'textInput', 'card', 'stack')",
          ),
      },
    },
    ({ type }) => {
      const component = getComponent(type);
      if (!component) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: `Component "${type}" not found` }),
            },
          ],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(component, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_pattern",
    {
      title: "Get Composition Pattern",
      description: `Get a reusable composition pattern with complete example code.

Available patterns:
- card-with-header: Card with heading and description
- data-list: List bound to data source with card items
- stats-dashboard: Grid of stat cards with trends
- simple-form: Basic form with text inputs
- report-form: Allergy report form with severity and symptoms
- allergen-badges: Inline list of allergen badges`,
      inputSchema: {
        name: z.string().describe("Pattern name"),
      },
    },
    ({ name }) => {
      const pattern = getPattern(name);
      if (!pattern) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Pattern "${name}" not found`,
                availablePatterns: [
                  "card-with-header",
                  "data-list",
                  "stats-dashboard",
                  "simple-form",
                  "report-form",
                  "allergen-badges",
                ],
              }),
            },
          ],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(pattern, null, 2) }],
      };
    },
  );

  server.registerTool(
    "list_patterns",
    {
      title: "List Composition Patterns",
      description: "List all available composition patterns by category.",
      inputSchema: {
        category: z
          .string()
          .optional()
          .describe("Filter by category (layout, data, form)"),
      },
    },
    ({ category }) => {
      const patterns = listPatterns(category);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                count: patterns.length,
                patterns: patterns.map((p) => ({
                  name: p.name,
                  description: p.description,
                  category: p.category,
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "schema_overview",
    {
      title: "SDUI Schema Overview",
      description:
        "Get complete overview of the SDUI schema including all categories, component types, data binding syntax, and action definitions.",
      inputSchema: {},
    },
    () => {
      const overview = getSchemaOverview();
      return {
        content: [{ type: "text", text: JSON.stringify(overview, null, 2) }],
      };
    },
  );

  // ---------------------------------------------------------------------------
  // Form Builder Tool
  // ---------------------------------------------------------------------------

  server.registerTool(
    "build_form_json",
    {
      title: "Build Form JSON",
      description: `Generate valid SDUI JSON for a form. Returns a complete section with form components that you can use directly.

Example input:
{
  "actionId": "create-report",
  "title": "Report Reaction",
  "fields": [
    { "name": "severity", "label": "Severity", "type": "select", "required": true, "options": [{"value": "LOW", "label": "Low"}, {"value": "HIGH", "label": "High"}] },
    { "name": "symptoms", "label": "Symptoms", "type": "textarea" }
  ]
}`,
      inputSchema: {
        actionId: z.string().describe("Action ID for form submission"),
        title: z.string().optional().describe("Form title"),
        description: z.string().optional().describe("Form description"),
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
              required: z.boolean().optional().describe("Is required"),
              placeholder: z.string().optional().describe("Placeholder"),
              hint: z.string().optional().describe("Help text"),
              options: z
                .array(z.object({ value: z.string(), label: z.string() }))
                .optional()
                .describe("Options for select/radio"),
            }),
          )
          .min(1)
          .describe("Form fields"),
      },
    },
    ({ actionId, title, description, submitLabel, fields }) => {
      const id = () => crypto.randomUUID();

      const formChildren = fields.map((field) => {
        let inputComponent: Record<string, unknown>;

        switch (field.type) {
          case "textarea":
            inputComponent = {
              id: id(),
              type: "textarea",
              props: {
                name: field.name,
                placeholder: field.placeholder,
                rows: 4,
              },
            };
            break;
          case "select":
            inputComponent = {
              id: id(),
              type: "select",
              props: {
                name: field.name,
                placeholder: field.placeholder ?? `Select ${field.label}`,
                options: field.options ?? [],
              },
            };
            break;
          case "checkbox":
            inputComponent = {
              id: id(),
              type: "checkbox",
              props: { name: field.name, label: field.label },
            };
            break;
          case "radio":
            inputComponent = {
              id: id(),
              type: "radio",
              props: { name: field.name, options: field.options ?? [] },
            };
            break;
          case "date":
            inputComponent = {
              id: id(),
              type: "dateInput",
              props: { name: field.name, placeholder: field.placeholder },
            };
            break;
          default:
            inputComponent = {
              id: id(),
              type: "textInput",
              props: {
                name: field.name,
                placeholder: field.placeholder,
                inputType: field.type,
              },
            };
        }

        return {
          id: id(),
          type: "formField",
          props: {
            name: field.name,
            label: field.label,
            required: field.required ?? false,
            hint: field.hint,
          },
          children: [inputComponent],
        };
      });

      const section = {
        id: id(),
        tone: "default",
        background: "surface",
        padding: "lg",
        gap: "md",
        width: "default",
        border: "soft",
        header: title ? { title, description, align: "start" } : undefined,
        components: [
          {
            id: id(),
            type: "form",
            props: { actionId, submitLabel: submitLabel ?? "Submit" },
            children: formChildren,
          },
        ],
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ section }, null, 2),
          },
        ],
      };
    },
  );

  // ---------------------------------------------------------------------------
  // Section Builder Tool
  // ---------------------------------------------------------------------------

  server.registerTool(
    "build_section_json",
    {
      title: "Build Section JSON",
      description: `Generate valid SDUI JSON for a section with components.

Example input:
{
  "title": "Product Info",
  "components": [
    { "type": "heading", "props": { "text": "Rice Crackers", "level": "4" } },
    { "type": "text", "props": { "text": "Gluten-free snack", "tone": "muted" } },
    { "type": "badge", "props": { "text": "Safe", "tone": "success" } }
  ]
}`,
      inputSchema: {
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
              type: z.string().describe("Component type"),
              props: z.record(z.unknown()).describe("Component props"),
            }),
          )
          .min(1)
          .describe("Components"),
      },
    },
    ({ kicker, title, description, tone, components }) => {
      const id = () => crypto.randomUUID();

      const section = {
        id: id(),
        tone: tone ?? "default",
        background: "surface",
        padding: "lg",
        gap: "md",
        width: "default",
        border: "soft",
        header:
          kicker || title || description
            ? { kicker, title, description, align: "start" }
            : undefined,
        components: components.map((c) => ({
          id: id(),
          type: c.type,
          props: c.props,
        })),
      };

      return {
        content: [{ type: "text", text: JSON.stringify({ section }, null, 2) }],
      };
    },
  );

  return server;
}

// =============================================================================
// tRPC MCP Server
// =============================================================================

function createTrpcServer(): McpServer {
  const server = new McpServer({
    name: "trpc-mcp-server",
    version: "1.0.0",
  });

  server.registerTool(
    "list_routers",
    {
      title: "List tRPC Routers",
      description:
        "List all available tRPC routers: product, report, allergen, auth",
      inputSchema: {},
    },
    () => {
      const routers = listRouters();
      return {
        content: [{ type: "text", text: JSON.stringify({ routers }, null, 2) }],
      };
    },
  );

  server.registerTool(
    "list_procedures",
    {
      title: "List tRPC Procedures",
      description: "List procedures. Filter by router to see specific ones.",
      inputSchema: {
        router: z
          .string()
          .optional()
          .describe("Filter by router (product, report, allergen, auth)"),
      },
    },
    ({ router }) => {
      const procedures = listProcedures(router);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                count: procedures.length,
                procedures: procedures.map((p) => ({
                  name: p.procedure,
                  type: p.type,
                  description: p.description,
                  requiresAuth: p.requiresAuth,
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_procedure",
    {
      title: "Get Procedure Schema",
      description:
        "Get detailed input/output schema for a procedure. Use this to understand what data is needed.",
      inputSchema: {
        name: z
          .string()
          .describe("Procedure name (e.g., 'report.create', 'product.search')"),
      },
    },
    ({ name }) => {
      const procedure = getProcedure(name);
      if (!procedure) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: `Procedure "${name}" not found` }),
            },
          ],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(procedure, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_form_fields",
    {
      title: "Get Form Fields for Procedure",
      description:
        "Get recommended form fields for a tRPC procedure. Returns field configs ready for build_form_json.",
      inputSchema: {
        procedure: z
          .string()
          .describe("Procedure name (e.g., 'report.create')"),
      },
    },
    ({ procedure }) => {
      const fields = getFormFieldsForProcedure(procedure);
      if (fields.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `No fields found for "${procedure}"`,
              }),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ procedure, fields }, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

// =============================================================================
// Express App
// =============================================================================

const app = express();
app.use(cors());
app.use(express.json());

// Shared server instances
const sduiServer = createSduiServer();
const trpcServer = createTrpcServer();

// MCP handler factory to avoid code duplication
async function handleMcpRequest(
  server: McpServer,
  serverName: string,
  req: express.Request,
  res: express.Response,
) {
  console.log(`[${serverName}] ${req.method} request received`);

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      console.log(`[${serverName}] Connection closed`);
      transport.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error(`[${serverName}] MCP error:`, error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
}

// SDUI MCP endpoint - handles both GET (SSE) and POST (JSON-RPC)
app.all("/mcp/sdui", async (req, res) => {
  await handleMcpRequest(sduiServer, "SDUI", req, res);
});

// tRPC MCP endpoint - handles both GET (SSE) and POST (JSON-RPC)
app.all("/mcp/trpc", async (req, res) => {
  await handleMcpRequest(trpcServer, "tRPC", req, res);
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", endpoints: ["/mcp/sdui", "/mcp/trpc"] });
});

// Start server
// eslint-disable-next-line no-restricted-properties
const PORT = parseInt(process.env.MCP_PORT ?? "3002", 10);
const server = app.listen(PORT, () => {
  console.log(`🔌 MCP Server running on http://localhost:${PORT}`);
  console.log(`   SDUI tools: http://localhost:${PORT}/mcp/sdui`);
  console.log(`   tRPC tools: http://localhost:${PORT}/mcp/trpc`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. The MCP server may already be running.`,
    );
    console.error(
      `   If you need to restart, stop the existing process first.`,
    );
    process.exit(1);
  } else {
    console.error("❌ MCP Server error:", error);
    process.exit(1);
  }
});
